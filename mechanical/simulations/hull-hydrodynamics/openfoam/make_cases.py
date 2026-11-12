import numpy as np, trimesh, math, shutil, subprocess, os, re
RHO = 1025.0
def build(tag, stl, mass, zg_mm, tilt_deg=10.0):
    mesh = trimesh.load(stl)
    lo, hi = 0.03, 0.12
    for _ in range(50):
        d = (lo + hi) / 2
        s = mesh.slice_plane([0, 0, d], [0, 0, -1], cap=True)       # part below z = d (keel at 0)
        lo, hi = (d, hi) if s.volume < mass / RHO else (lo, d)
    draft = (lo + hi) / 2; zg = zg_mm * 1e-3
    mesh = mesh.copy(); mesh.apply_translation([0, 0, -draft])
    cg = np.array([0, 0, zg - draft])
    T = np.eye(4); R = trimesh.transformations.rotation_matrix(math.radians(tilt_deg), [0, 1, 0], point=cg); mesh.apply_transform(R)
    case = f"foam/{tag}"; shutil.rmtree(case, ignore_errors=True)
    os.makedirs(case + "/constant/triSurface"); mesh.export(case + "/constant/triSurface/floatingObject.stl")
    tut = subprocess.run(["bash", "-lc", "export PATH=/opt/homebrew/bin:$PATH; openfoam -c 'echo $FOAM_TUTORIALS'"], capture_output=True, text=True).stdout.strip().splitlines()[-1] + "/multiphase/interFoam/RAS/floatingObject"
    for sub in ("0.orig", "system", "constant"):
        shutil.copytree(f"{tut}/{sub}", f"{case}/{sub}", dirs_exist_ok=True)
    for f in ("constant/dynamicMeshDict.sixDoF", "system/topoSetDict"): os.remove(f"{case}/{f}")
    HDR = "FoamFile\n{\n    version 2.0;\n    format ascii;\n    class dictionary;\n    object %s;\n}\n"
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
    W("system/snappyHexMeshDict", "snappyHexMeshDict", """castellatedMesh true; snap true; addLayers false;
geometry
{
    floatingObject.stl { type triSurfaceMesh; name floatingObject; }
    surfaceBand { type searchableBox; min (-1 -1 -0.04); max (1 1 0.04); }
}
castellatedMeshControls
{
    maxLocalCells 4000000; maxGlobalCells 6000000; minRefinementCells 10; maxLoadUnbalance 0.2; nCellsBetweenLevels 3;
    features ();
    refinementSurfaces { floatingObject { level (2 3); patchInfo { type wall; } } }
    refinementRegions
    {
        floatingObject { mode distance; levels ((0.02 3) (0.06 2) (0.15 1)); }
        surfaceBand { mode inside; levels ((1e15 1)); }
    }
    resolveFeatureAngle 30; locationInMesh (0.9 0.9 0.2); allowFreeStandingZoneFaces true;
}
snapControls { nSmoothPatch 3; tolerance 2.0; nSolveIter 100; nRelaxIter 5; nFeatureSnapIter 10; implicitFeatureSnap false; explicitFeatureSnap false; multiRegionFeatureSnap false; }
addLayersControls { relativeSizes true; layers {} expansionRatio 1.0; finalLayerThickness 0.3; minThickness 0.1; nGrow 0; featureAngle 60; nRelaxIter 3; nSmoothSurfaceNormals 1; nSmoothNormals 3; nSmoothThickness 10; maxFaceThicknessRatio 0.5; maxThicknessToMedialRatio 0.3; minMedianAxisAngle 90; nBufferCellsNoExtrude 0; nLayerIter 50; }
meshQualityControls
{
    maxNonOrtho 65; maxBoundarySkewness 20; maxInternalSkewness 4; maxConcave 80; minVol 1e-13; minTetQuality 1e-15; minArea -1;
    minTwist 0.02; minDeterminant 0.001; minFaceWeight 0.05; minVolRatio 0.01; minTriangleTwist -1; nSmoothScale 4; errorReduction 0.75;
    relaxed { maxNonOrtho 75; }
}
mergeTolerance 1e-6;
""")
    W("system/setFieldsDict", "setFieldsDict", """defaultFieldValues (volScalarFieldValue alpha.water 0);
regions (boxToCell { box (-1 -1 -1) (1 1 0); fieldValues (volScalarFieldValue alpha.water 1); });
""")
    ctrl = open(f"{case}/system/controlDict").read()
    ctrl = re.sub(r"endTime\s+[\d.]+;", "endTime 3;", ctrl); ctrl = re.sub(r"deltaT\s+[\d.]+;", "deltaT 0.0002;", ctrl)
    ctrl = re.sub(r"writeInterval\s+[\d.]+;", "writeInterval 0.05;", ctrl); ctrl = re.sub(r"maxCo\s+[\d.]+;", "maxCo 0.5;", ctrl)
    ctrl = re.sub(r"maxAlphaCo\s+[\d.]+;", "maxAlphaCo 0.5;", ctrl); ctrl = re.sub(r"maxDeltaT\s+[\d.]+;", "maxDeltaT 0.004;", ctrl)
    open(f"{case}/system/controlDict", "w").write(ctrl)
    dm = open(f"{case}/constant/dynamicMeshDict").read()
    body = f"""        floatingObject
        {{
            type            rigidBody;
            parent          root;
            mass            {mass};
            centreOfMass    (0 0 0);
            inertia         (0.0131 0 0 0.0131 0 0.020);
            transform       (1 0 0 0 1 0 0 0 1) (0 0 {zg - draft:.5f});
            joint {{ type composite; joints ( {{ type Pz; }} {{ type Ry; }} ); }}
            patches         (floatingObject);
            innerDistance   0.05;
            outerDistance   0.35;
        }}
"""
    dm = re.sub(r"        floatingObject\n        \{.*?\n        \}\n", body, dm, flags=re.S)
    dm = re.sub(r"\(0\s+0\)\s*\n\s*\(3\.99999\s+0\)\s*\n\s*\(4\s+0\.7\)", "(0 0.7)", dm)
    open(f"{case}/constant/dynamicMeshDict", "w").write(dm)
    dp = open(f"{case}/system/decomposeParDict").read()
    dp = re.sub(r"numberOfSubdomains\s+\d+;", "numberOfSubdomains 10;", dp); open(f"{case}/system/decomposeParDict", "w").write(dp)
    open(f"{case}/Allrun", "w").write("""#!/bin/sh
cd "${0%/*}" || exit
. ${WM_PROJECT_DIR:?}/bin/tools/RunFunctions
restore0Dir
runApplication blockMesh
runApplication snappyHexMesh -overwrite
runApplication checkMesh
runApplication setFields
runApplication decomposePar
runParallel $(getApplication)
runApplication reconstructPar
touch case.foam
""")
    os.chmod(f"{case}/Allrun", 0o755)
    print(f"{tag}: mass {mass} kg, draft {draft*1000/25.4:.3f} in (keel {-draft:.4f} m), CoG z {cg[2]:.4f} m, tilt {tilt_deg} deg, submerged check ok")
build("rolldecay-nofins", "hull_nofins.stl", 2.674, 60.8)
build("rolldecay-fins", "hull_fins.stl", 2.7574, 59.9)
