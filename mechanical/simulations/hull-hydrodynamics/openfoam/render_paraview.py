from paraview.simple import *
for c in ['rolldecay-fins','rolldecay-nofins']:
    rw=OpenFOAMReader(FileName=f'{c}/case.foam'); rw.MeshRegions=['internalMesh']; rw.CellArrays=['alpha.water']
    rf=OpenFOAMReader(FileName=f'{c}/case.foam'); rf.MeshRegions=['patch/floatingObject']; rf.CellArrays=['alpha.water']
    for t in [0.05,0.42,0.85,1.7]:
        v=CreateRenderView(); v.ViewSize=[1000,700]; v.OrientationAxesVisibility=0
        v.UseColorPaletteForBackground=0; v.Background=[1,1,1]; v.ViewTime=t
        s=Slice(Input=MergeBlocks(Input=rw)); s.SliceType='Plane'; s.SliceType.Origin=[0,0,0]; s.SliceType.Normal=[0,1,0]
        d=Show(s,v); d.Representation='Surface'; ColorBy(d,('CELLS','alpha.water'))
        lut=GetColorTransferFunction('alpha.water'); lut.ApplyPreset('Blues',True); lut.RescaleTransferFunction(0,1.2); lut.InvertTransferFunction()
        fd=Show(MergeBlocks(Input=rf),v); fd.Representation='Surface'; ColorBy(fd,('POINTS',None)) if False else None
        fd.ColorArrayName=['CELLS','']; fd.AmbientColor=fd.DiffuseColor=[0.95,0.55,0.05]
        v.CameraPosition=[0,-1.5,0.0]; v.CameraFocalPoint=[0,0,0.0]; v.CameraViewUp=[0,0,1]; v.CameraParallelProjection=1; v.CameraParallelScale=0.2
        Render(v); SaveScreenshot(f'img_{c}_{t}.png',v); Delete(v)
