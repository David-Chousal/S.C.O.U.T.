"""Build the Test Assembly 10 roll-decay cases (with and without fins) for the multi-night OpenFOAM run.

Differs from make_cases.py (Test Assembly 9, 10 degree, 3 s): a finer, region-based fin mesh (the fins are their own STL
region with their own refinement level), a 30 degree start, a 6 s run, and restart-safe output (a full write every
15 minutes of wall time, only the last few kept) so the run can be stopped each morning and resumed each night.

Usage: python make_cases_ta10.py [--root ~/scout-cfd] [--tilt 30] [--end 6] [--hull-level 3] [--fin-level 5]
                                 [--ranks 7] [--draft-mm 74.4] [--only fins|nofins] [--tag-suffix -smoke]
Needs hull_nofins.stl / hull_fins.stl (make_hull_ta10.py) in --root, and the OpenFOAM tutorials (via `openfoam`).
"""
import argparse, math, os, re, shutil, subprocess
import numpy as np, trimesh

ap = argparse.ArgumentParser()
ap.add_argument("--root", default=os.path.expanduser("~/scout-cfd"))
ap.add_argument("--tilt", type=float, default=30.0)
ap.add_argument("--end", type=float, default=6.0)
ap.add_argument("--hull-level", type=int, default=3)
ap.add_argument("--fin-level", type=int, default=5)
ap.add_argument("--ranks", type=int, default=7)
ap.add_argument("--draft-mm", type=float, default=74.4, help="Test Assembly 10 estimate, 2.93 in (test-assembly-10.md)")
ap.add_argument("--zg-fins", type=float, default=59.9); ap.add_argument("--zg-nofins", type=float, default=60.8)
ap.add_argument("--only", choices=["fins", "nofins"]); ap.add_argument("--tag-suffix", default="")
ap.add_argument("--clock-write", type=int, default=900, help="wall seconds between restart writes")
A = ap.parse_args()
RHO = 1025.0
HDR = "FoamFile\n{\n    version 2.0;\n    format ascii;\n    class dictionary;\n    object %s;\n}\n"

def statics(single_stl, draft_m, zg_m):
    """mass for the target draft, and GM from the hull geometry (waterplane inertia + buoyancy centroid)."""
    m = trimesh.load(single_stl)
    sub = m.slice_plane([0, 0, draft_m], [0, 0, -1], cap=True)
    V = sub.volume; kb = sub.center_mass[2]
    wp = m.section(plane_origin=[0, 0, draft_m], plane_normal=[0, 0, 1])
    I = 0.0
    for poly in wp.to_planar()[0].polygons_full:
        # to_planar re-centres; second moment about the centroid axis is translation-safe for a body of revolution
        xy = np.asarray(poly.exterior.coords); x, y = xy[:, 0], xy[:, 1]
        I += abs(sum((x[i] * y[i + 1] - x[i + 1] * y[i]) * (y[i] ** 2 + y[i] * y[i + 1] + y[i + 1] ** 2) for i in range(len(x) - 1))) / 12
    return RHO * V, (kb + I / V - zg_m)

def build(tag, stl, single, zg_mm, regions):
    tag += A.tag_suffix
    draft = A.draft_mm * 1e-3; zg = zg_mm * 1e-3
    mass, gm = statics(f"{A.root}/{single}", draft, zg)
    # load the multi-solid STL as ASCII text, shift and tilt it vertex by vertex
    txt = open(f"{A.root}/{stl}").read()
    cg = np.array([0.0, 0.0, zg - draft])
    R = trimesh.transformations.rotation_matrix(math.radians(A.tilt), [0, 1, 0], point=cg)
    def move(mo):
        v = np.array([float(mo.group(i)) for i in (1, 2, 3)]) - [0, 0, draft]
        v = (R @ np.append(v, 1.0))[:3]
        return "vertex %.7e %.7e %.7e" % tuple(v)
    txt = re.sub(r"vertex\s+(\S+)\s+(\S+)\s+(\S+)", move, txt)
    case = f"{A.root}/foam/{tag}"; shutil.rmtree(case, ignore_errors=True)
    os.makedirs(case + "/constant/triSurface"); open(case + "/constant/triSurface/floatingObject.stl", "w").write(txt)
    tut = subprocess.run(["bash", "-lc", "export PATH=/opt/homebrew/bin:$PATH; openfoam -c 'echo $FOAM_TUTORIALS'"],
                         capture_output=True, text=True).stdout.strip().splitlines()[-1] + "/multiphase/interFoam/RAS/floatingObject"
    for sub in ("0.orig", "system", "constant"):
        shutil.copytree(f"{tut}/{sub}", f"{case}/{sub}", dirs_exist_ok=True)
    for f in ("constant/dynamicMeshDict.sixDoF", "system/topoSetDict"): os.remove(f"{case}/{f}")
    for f in os.listdir(case + "/0.orig"):      # snappyHexMesh names the patches after the STL regions: hull, fins
        p = f"{case}/0.orig/{f}"; s = open(p).read()
        open(p, "w").write(re.sub(r"\n    floatingObject\n", '\n    "(hull|fins)"\n', s))
    W = lambda p, name, body: open(f"{case}/{p}", "w").write(HDR % name + body)
    W("constant/g", "g", "dimensions [0 1 -2 0 0 0 0];\nvalue (0 0 -9.81);\n")
    W("constant/turbulenceProperties", "turbulenceProperties", "simulationType laminar;\n")
    W("system/blockMeshDict", "blockMeshDict", """scale 1;
vertices ((-1 -1 -0.4) (1 -1 -0.4) (1 1 -0.4) (-1 1 -0.4) (-1 -1 0.4) (1 -1 0.4) (1 1 0.4) (-1 1 0.4));
blocks (hex (0 1 2 3 4 5 6 7) (50 50 20) simpleGrading (1 1 1));
edges ();
boundary
(
    stationaryWalls { type wall; faces ((0 3 2 1) (2 6 5 1) (1 5 4 0) (3 7 6 2) (0 4 7 3)); }
    atmosphere { type patch; faces ((4 5 6 7)); }
);
mergePatchPairs ();
""")
    HL, FL = A.hull_level, A.fin_level
    geom_regions = " ".join(f"{r} {{ name {r}; }}" for r in regions)
    fin_levels = f"regions {{ fins {{ level ({FL} {FL}); }} }}" if "fins" in regions else ""
    W("system/snappyHexMeshDict", "snappyHexMeshDict", f"""castellatedMesh true; snap true; addLayers false;
geometry
{{
    floatingObject.stl {{ type triSurfaceMesh; name floatingObject; regions {{ {geom_regions} }} }}
    surfaceBand {{ type searchableBox; min (-1 -1 -0.04); max (1 1 0.04); }}
}}
castellatedMeshControls
{{
    maxLocalCells 8000000; maxGlobalCells 12000000; minRefinementCells 10; maxLoadUnbalance 0.2; nCellsBetweenLevels 3;
    features ();
    refinementSurfaces {{ floatingObject {{ level ({HL} {HL}); {fin_levels} patchInfo {{ type wall; }} }} }}
    refinementRegions
    {{
        floatingObject {{ mode distance; levels ((0.02 {HL}) (0.06 2) (0.15 1)); }}
        surfaceBand {{ mode inside; levels ((1e15 1)); }}
    }}
    resolveFeatureAngle 30; locationInMesh (0.9 0.9 0.2); allowFreeStandingZoneFaces true;
}}
snapControls {{ nSmoothPatch 3; tolerance 2.0; nSolveIter 100; nRelaxIter 5; nFeatureSnapIter 10; implicitFeatureSnap false; explicitFeatureSnap false; multiRegionFeatureSnap false; }}
addLayersControls {{ relativeSizes true; layers {{}} expansionRatio 1.0; finalLayerThickness 0.3; minThickness 0.1; nGrow 0; featureAngle 60; nRelaxIter 3; nSmoothSurfaceNormals 1; nSmoothNormals 3; nSmoothThickness 10; maxFaceThicknessRatio 0.5; maxThicknessToMedialRatio 0.3; minMedianAxisAngle 90; nBufferCellsNoExtrude 0; nLayerIter 50; }}
meshQualityControls
{{
    maxNonOrtho 65; maxBoundarySkewness 20; maxInternalSkewness 4; maxConcave 80; minVol 1e-18; minTetQuality 1e-15; minArea -1;
    minTwist 0.02; minDeterminant 0.001; minFaceWeight 0.05; minVolRatio 0.01; minTriangleTwist -1; nSmoothScale 4; errorReduction 0.75;
    relaxed {{ maxNonOrtho 75; }}
}}
mergeTolerance 1e-6;
""")
    W("system/setFieldsDict", "setFieldsDict", """defaultFieldValues (volScalarFieldValue alpha.water 0);
regions (boxToCell { box (-1 -1 -1) (1 1 0); fieldValues (volScalarFieldValue alpha.water 1); });
""")
    ctrl = open(f"{case}/system/controlDict").read()
    sub = lambda k, v: re.sub(rf"\n{k}\s+[^;]+;", f"\n{k} {v};", ctrl)
    for k, v in (("startFrom", "latestTime"), ("endTime", A.end), ("deltaT", "0.0001"), ("writeControl", "clockTime"),
                 ("writeInterval", A.clock_write), ("purgeWrite", 4), ("timePrecision", 12), ("maxCo", "0.5"), ("maxAlphaCo", "0.5"), ("maxDeltaT", "0.004")):
        ctrl = sub(k, v)
    open(f"{case}/system/controlDict", "w").write(ctrl)
    dm = open(f"{case}/constant/dynamicMeshDict").read()
    patches = " ".join(regions)
    body = f"""        floatingObject
        {{
            type            rigidBody;
            parent          root;
            mass            {mass:.5f};
            centreOfMass    (0 0 0);
            inertia         (0.0131 0 0 0.0131 0 0.020);
            transform       (1 0 0 0 1 0 0 0 1) (0 0 {zg - draft:.5f});
            joint {{ type composite; joints ( {{ type Pz; }} {{ type Ry; }} ); }}
            patches         ({patches});
            innerDistance   0.05;
            outerDistance   0.35;
        }}
"""
    dm = re.sub(r"        floatingObject\n        \{.*?\n        \}\n", body, dm, flags=re.S)
    dm = re.sub(r"\(0\s+0\)\s*\n\s*\(3\.99999\s+0\)\s*\n\s*\(4\s+0\.7\)", "(0 0.7)", dm)
    open(f"{case}/constant/dynamicMeshDict", "w").write(dm)
    dp = open(f"{case}/system/decomposeParDict").read()
    open(f"{case}/system/decomposeParDict", "w").write(re.sub(r"numberOfSubdomains\s+\d+;", f"numberOfSubdomains {A.ranks};", dp))
    with open(f"{case}/RANKS", "w") as fh: fh.write(f"{A.ranks}\n")
    open(f"{case}/case.foam", "w").close()
    print(f"{tag}: mass {mass:.4f} kg (target draft {A.draft_mm:.1f} mm), CoG z {cg[2]:.4f} m, GM {gm*1000/25.4:.2f} in "
          f"(Test Assembly 10 estimate 1.30 in), tilt {A.tilt} deg, end {A.end} s, hull L{HL} fins L{FL}, {A.ranks} ranks")

if A.only != "fins":
    build("ta10-nofins", "hull_nofins.stl", "hull_nofins_single.stl", A.zg_nofins, ["hull"])
if A.only != "nofins":
    build("ta10-fins", "hull_fins.stl", "hull_fins_single.stl", A.zg_fins, ["hull", "fins"])
