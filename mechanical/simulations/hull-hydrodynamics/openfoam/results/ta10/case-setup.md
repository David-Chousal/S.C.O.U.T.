# Test Assembly 10 CFD case setup
> **Summary** — The OpenFOAM dictionaries and mesh check for the two Test Assembly 10 roll-decay cases, kept as text
> because OpenFOAM file names (camel case) break the repo's lowercase naming rule. Rebuild the cases with
> `make_cases_ta10.py`; this is the record of what was run. `fvSchemes` and `fvSolution` are the unmodified tutorial
> files (`multiphase/interFoam/RAS/floatingObject`) and are not repeated.
>
> Part of the [hull-hydrodynamics README](../../../README.md).

## ta10-fins
Ranks: 7

### controlDict

```
/*--------------------------------*- C++ -*----------------------------------*\
| =========                 |                                                 |
| \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\    /   O peration     | Version:  v2606                                 |
|   \\  /    A nd           | Website:  www.openfoam.com                      |
|    \\/     M anipulation  |                                                 |
\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      controlDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

application     interFoam;

startFrom latestTime;

startTime       0;

stopAt          endTime;

endTime 6.0;

deltaT 0.0001;

writeControl clockTime;

writeInterval 900;

purgeWrite 4;

writeFormat     ascii;

writePrecision  12;

writeCompression off;

timeFormat      general;

timePrecision   12;

runTimeModifiable yes;

adjustTimeStep  yes;

maxCo 0.5;

maxAlphaCo 0.5;

maxDeltaT 0.004;


// ************************************************************************* //
```

### dynamicMeshDict

```
/*--------------------------------*- C++ -*----------------------------------*\
| =========                 |                                                 |
| \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\    /   O peration     | Version:  v2606                                 |
|   \\  /    A nd           | Website:  www.openfoam.com                      |
|    \\/     M anipulation  |                                                 |
\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      dynamicMeshDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dynamicFvMesh       dynamicMotionSolverFvMesh;

motionSolverLibs   (rigidBodyMeshMotion);

motionSolver       rigidBodyMotion;

rigidBodyMotionCoeffs
{
    report          on;

    solver
    {
        type Newmark;
    }

    accelerationRelaxation table
    (
        // time     relaxation-factor
        (0 0.7)
    );

    bodies
    {
        floatingObject
        {
            type            rigidBody;
            parent          root;
            mass            2.82018;
            centreOfMass    (0 0 0);
            inertia         (0.0131 0 0 0.0131 0 0.020);
            transform       (1 0 0 0 1 0 0 0 1) (0 0 -0.01450);
            joint { type composite; joints ( { type Pz; } { type Ry; } ); }
            patches         (hull fins);
            innerDistance   0.05;
            outerDistance   0.35;
        }
    }
}


// ************************************************************************* //
```

### snappyHexMeshDict

```
FoamFile
{
    version 2.0;
    format ascii;
    class dictionary;
    object snappyHexMeshDict;
}
castellatedMesh true; snap true; addLayers false;
geometry
{
    floatingObject.stl { type triSurfaceMesh; name floatingObject; regions { hull { name hull; } fins { name fins; } } }
    surfaceBand { type searchableBox; min (-1 -1 -0.04); max (1 1 0.04); }
}
castellatedMeshControls
{
    maxLocalCells 8000000; maxGlobalCells 12000000; minRefinementCells 10; maxLoadUnbalance 0.2; nCellsBetweenLevels 3;
    features ();
    refinementSurfaces { floatingObject { level (3 3); regions { fins { level (5 5); } } patchInfo { type wall; } } }
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
    maxNonOrtho 65; maxBoundarySkewness 20; maxInternalSkewness 4; maxConcave 80; minVol 1e-18; minTetQuality 1e-15; minArea -1;
    minTwist 0.02; minDeterminant 0.001; minFaceWeight 0.05; minVolRatio 0.01; minTriangleTwist -1; nSmoothScale 4; errorReduction 0.75;
    relaxed { maxNonOrtho 75; }
}
mergeTolerance 1e-6;
```

### blockMeshDict

```
FoamFile
{
    version 2.0;
    format ascii;
    class dictionary;
    object blockMeshDict;
}
scale 1;
vertices ((-1 -1 -0.4) (1 -1 -0.4) (1 1 -0.4) (-1 1 -0.4) (-1 -1 0.4) (1 -1 0.4) (1 1 0.4) (-1 1 0.4));
blocks (hex (0 1 2 3 4 5 6 7) (50 50 20) simpleGrading (1 1 1));
edges ();
boundary
(
    stationaryWalls { type wall; faces ((0 3 2 1) (2 6 5 1) (1 5 4 0) (3 7 6 2) (0 4 7 3)); }
    atmosphere { type patch; faces ((4 5 6 7)); }
);
mergePatchPairs ();
```

### setFieldsDict

```
FoamFile
{
    version 2.0;
    format ascii;
    class dictionary;
    object setFieldsDict;
}
defaultFieldValues (volScalarFieldValue alpha.water 0);
regions (boxToCell { box (-1 -1 -1) (1 1 0); fieldValues (volScalarFieldValue alpha.water 1); });
```

### decomposeParDict

```
/*--------------------------------*- C++ -*----------------------------------*\
| =========                 |                                                 |
| \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\    /   O peration     | Version:  v2606                                 |
|   \\  /    A nd           | Website:  www.openfoam.com                      |
|    \\/     M anipulation  |                                                 |
\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      decomposeParDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

numberOfSubdomains 7;

method          scotch;


// ************************************************************************* //
```

### log.checkMesh

```
per cell:   6.24075681305
    boundary patches: 4
    point zones:      1
    face zones:       0
    cell zones:       0
Overall number of cells of each type:
    hexahedra:     186580
    prisms:        3603
    wedges:        0
    pyramids:      0
    tet wedges:    58
    tetrahedra:    2
    polyhedra:     28675
    Breakdown of polyhedra by number of faces:
        faces   number of cells
            4   4160
            5   2546
            6   6629
            7   74
            8   62
            9   10024
           10   14
           11   38
           12   3169
           14   22
           15   1885
           18   52
Checking topology...
    Boundary definition OK.
    Cell to face addressing OK.
    Point usage OK.
    Upper triangular ordering OK.
    Face vertices OK.
    Number of regions: 1 (OK).
Checking patch topology for multiply connected surfaces...
                   Patch    Faces   Points  Surface topology
         stationaryWalls     7700     8001  ok (non-closed singly connected)
              atmosphere     2500     2601  ok (non-closed singly connected)
                    hull    12004    15804  ok (non-closed singly connected)
                    fins    10726    13860  ok (non-closed singly connected)
                    ".*"    32930    38740      ok (closed singly connected)
Checking faceZone topology for multiply connected surfaces...
    No faceZones found.
Checking basic cellZone addressing...
    No cellZones found.
Checking basic pointZone addressing...
               PointZone  PointsBoundingBox
            frozenPoints       0(1e+150 1e+150 1e+150) (-1e+150 -1e+150 -1e+150)
Checking geometry...
    Overall domain bounding box (-1.00000000171 -1.00000000614 -0.400000545843) (1 1.00000000615 0.4)
    Mesh has 3 geometric (non-empty/wedge) directions (1 1 1)
    Mesh has 3 solution (non-empty) directions (1 1 1)
    Boundary openness (-1.08695470442e-16 9.61499926496e-17 3.95443298119e-16) OK.
    Max cell openness = 2.96411216127e-16 OK.
    Max aspect ratio = 4.42095020663 OK.
    Minimum face area = 1.92820177021e-07. Maximum face area = 0.00160400413659.  Face area magnitudes OK.
    Min volume = 3.02248765004e-10. Max volume = 6.41101479205e-05.  Total volume = 3.19353494915.  Cell volumes OK.
    Mesh non-orthogonality Max: 64.0573935313 average: 10.0672477496
    Non-orthogonality check OK.
    Face pyramids OK.
    Max skewness = 2.85367928697 OK.
    Coupled point location match (average 0) OK.
Mesh OK.
End
```

## ta10-nofins
Ranks: 7

### controlDict

```
/*--------------------------------*- C++ -*----------------------------------*\
| =========                 |                                                 |
| \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\    /   O peration     | Version:  v2606                                 |
|   \\  /    A nd           | Website:  www.openfoam.com                      |
|    \\/     M anipulation  |                                                 |
\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      controlDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

application     interFoam;

startFrom latestTime;

startTime       0;

stopAt          endTime;

endTime 6.0;

deltaT 0.0001;

writeControl clockTime;

writeInterval 900;

purgeWrite 4;

writeFormat     ascii;

writePrecision  12;

writeCompression off;

timeFormat      general;

timePrecision   6;

runTimeModifiable yes;

adjustTimeStep  yes;

maxCo 0.5;

maxAlphaCo 0.5;

maxDeltaT 0.004;


// ************************************************************************* //
```

### dynamicMeshDict

```
/*--------------------------------*- C++ -*----------------------------------*\
| =========                 |                                                 |
| \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\    /   O peration     | Version:  v2606                                 |
|   \\  /    A nd           | Website:  www.openfoam.com                      |
|    \\/     M anipulation  |                                                 |
\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      dynamicMeshDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dynamicFvMesh       dynamicMotionSolverFvMesh;

motionSolverLibs   (rigidBodyMeshMotion);

motionSolver       rigidBodyMotion;

rigidBodyMotionCoeffs
{
    report          on;

    solver
    {
        type Newmark;
    }

    accelerationRelaxation table
    (
        // time     relaxation-factor
        (0 0.7)
    );

    bodies
    {
        floatingObject
        {
            type            rigidBody;
            parent          root;
            mass            2.75175;
            centreOfMass    (0 0 0);
            inertia         (0.0131 0 0 0.0131 0 0.020);
            transform       (1 0 0 0 1 0 0 0 1) (0 0 -0.01360);
            joint { type composite; joints ( { type Pz; } { type Ry; } ); }
            patches         (hull);
            innerDistance   0.05;
            outerDistance   0.35;
        }
    }
}


// ************************************************************************* //
```

### snappyHexMeshDict

```
FoamFile
{
    version 2.0;
    format ascii;
    class dictionary;
    object snappyHexMeshDict;
}
castellatedMesh true; snap true; addLayers false;
geometry
{
    floatingObject.stl { type triSurfaceMesh; name floatingObject; regions { hull { name hull; } } }
    surfaceBand { type searchableBox; min (-1 -1 -0.04); max (1 1 0.04); }
}
castellatedMeshControls
{
    maxLocalCells 8000000; maxGlobalCells 12000000; minRefinementCells 10; maxLoadUnbalance 0.2; nCellsBetweenLevels 3;
    features ();
    refinementSurfaces { floatingObject { level (3 3);  patchInfo { type wall; } } }
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
    maxNonOrtho 65; maxBoundarySkewness 20; maxInternalSkewness 4; maxConcave 80; minVol 1e-18; minTetQuality 1e-15; minArea -1;
    minTwist 0.02; minDeterminant 0.001; minFaceWeight 0.05; minVolRatio 0.01; minTriangleTwist -1; nSmoothScale 4; errorReduction 0.75;
    relaxed { maxNonOrtho 75; }
}
mergeTolerance 1e-6;
```

### blockMeshDict

```
FoamFile
{
    version 2.0;
    format ascii;
    class dictionary;
    object blockMeshDict;
}
scale 1;
vertices ((-1 -1 -0.4) (1 -1 -0.4) (1 1 -0.4) (-1 1 -0.4) (-1 -1 0.4) (1 -1 0.4) (1 1 0.4) (-1 1 0.4));
blocks (hex (0 1 2 3 4 5 6 7) (50 50 20) simpleGrading (1 1 1));
edges ();
boundary
(
    stationaryWalls { type wall; faces ((0 3 2 1) (2 6 5 1) (1 5 4 0) (3 7 6 2) (0 4 7 3)); }
    atmosphere { type patch; faces ((4 5 6 7)); }
);
mergePatchPairs ();
```

### setFieldsDict

```
FoamFile
{
    version 2.0;
    format ascii;
    class dictionary;
    object setFieldsDict;
}
defaultFieldValues (volScalarFieldValue alpha.water 0);
regions (boxToCell { box (-1 -1 -1) (1 1 0); fieldValues (volScalarFieldValue alpha.water 1); });
```

### decomposeParDict

```
/*--------------------------------*- C++ -*----------------------------------*\
| =========                 |                                                 |
| \\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\    /   O peration     | Version:  v2606                                 |
|   \\  /    A nd           | Website:  www.openfoam.com                      |
|    \\/     M anipulation  |                                                 |
\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      decomposeParDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

numberOfSubdomains 7;

method          scotch;


// ************************************************************************* //
```

### log.checkMesh

```
 * * * * //
Create time
Create mesh for time = 0
Check mesh...
Time = 0
Mesh stats 
    points:           159748
    faces:            431013
    internal faces:   414507
    cells:            136336
    faces per cell:   6.20173688534
    boundary patches: 3
    point zones:      1
    face zones:       0
    cell zones:       0
Overall number of cells of each type:
    hexahedra:     122654
    prisms:        1584
    wedges:        0
    pyramids:      0
    tet wedges:    2
    tetrahedra:    0
    polyhedra:     12096
    Breakdown of polyhedra by number of faces:
        faces   number of cells
            4   1016
            5   712
            6   2172
            9   6370
           12   1236
           15   590
Checking topology...
    Boundary definition OK.
    Cell to face addressing OK.
    Point usage OK.
    Upper triangular ordering OK.
    Face vertices OK.
    Number of regions: 1 (OK).
Checking patch topology for multiply connected surfaces...
                   Patch    Faces   Points  Surface topology
         stationaryWalls     7700     8001  ok (non-closed singly connected)
              atmosphere     2500     2601  ok (non-closed singly connected)
                    hull     6306     7489      ok (closed singly connected)
                    ".*"    16506    17891      ok (closed singly connected)
Checking faceZone topology for multiply connected surfaces...
    No faceZones found.
Checking basic cellZone addressing...
    No cellZones found.
Checking basic pointZone addressing...
               PointZone  PointsBoundingBox
            frozenPoints       0(1e+150 1e+150 1e+150) (-1e+150 -1e+150 -1e+150)
Checking geometry...
    Overall domain bounding box (-1 -1.00000000195 -0.400000708193) (1 1.00000000195 0.4)
    Mesh has 3 geometric (non-empty/wedge) directions (1 1 1)
    Mesh has 3 solution (non-empty) directions (1 1 1)
    Boundary openness (1.283226096e-16 1.43439527554e-16 3.86929432326e-16) OK.
    Max cell openness = 3.06185441899e-16 OK.
    Max aspect ratio = 4.25266158919 OK.
    Minimum face area = 8.07873909889e-06. Maximum face area = 0.00160374097192.  Face area magnitudes OK.
    Min volume = 2.12728199148e-08. Max volume = 6.40819744163e-05.  Total volume = 3.19360317368.  Cell volumes OK.
    Mesh non-orthogonality Max: 38.4929638906 average: 8.40570488387
    Non-orthogonality check OK.
    Face pyramids OK.
    Max skewness = 1.33268049737 OK.
    Coupled point location match (average 0) OK.
Mesh OK.
End
```
