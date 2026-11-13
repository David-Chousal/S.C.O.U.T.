from paraview.simple import *
import os
img=os.path.expanduser('~/scout-cfd/img'); os.makedirs(img, exist_ok=True); os.chdir(img)
cases={'ta10-fins':[5.325047725689186,5.537829940248,5.7033457438212],'ta10-nofins':[5.518545662015364,5.670924370695318,5.977083422964]}
for c,ts in cases.items():
    f=os.path.expanduser(f'~/scout-cfd/foam/{c}/case.foam')
    rw=OpenFOAMReader(FileName=f); rw.CaseType='Decomposed Case'; rw.MeshRegions=['internalMesh']; rw.CellArrays=['alpha.water']
    rf=OpenFOAMReader(FileName=f); rf.CaseType='Decomposed Case'; rf.MeshRegions=['patch/hull','patch/fins'] if 'nofins' not in c else ['patch/hull']; rf.CellArrays=['alpha.water']
    for i,t in enumerate(ts):
        v=CreateRenderView(); v.ViewSize=[900,650]; v.OrientationAxesVisibility=0
        v.UseColorPaletteForBackground=0; v.Background=[1,1,1]; v.ViewTime=t
        s=Slice(Input=MergeBlocks(Input=rw)); s.SliceType='Plane'; s.SliceType.Origin=[0,0,0]; s.SliceType.Normal=[0,1,0]
        d=Show(s,v); d.Representation='Surface'; ColorBy(d,('CELLS','alpha.water'))
        lut=GetColorTransferFunction('alpha.water'); lut.ApplyPreset('Blues',True); lut.RescaleTransferFunction(0,1.2); lut.InvertTransferFunction()
        fd=Show(MergeBlocks(Input=rf),v); fd.Representation='Surface'; fd.ColorArrayName=['CELLS','']; fd.AmbientColor=fd.DiffuseColor=[0.95,0.55,0.05]
        v.CameraPosition=[0,-1.5,0.0]; v.CameraFocalPoint=[0,0,0.0]; v.CameraViewUp=[0,0,1]; v.CameraParallelProjection=1; v.CameraParallelScale=0.2
        Render(v); SaveScreenshot(f'{c}_{i}.png',v); Delete(v)
