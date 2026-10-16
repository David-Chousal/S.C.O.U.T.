# Regenerates assets/diagrams/electronics-packaging-options-2026-10-15.svg (run from this folder).
S=2.3; W=111.8; H=127.0
PW=300; X0=70; Y0=140  # panel width, origin
C={'cell':'#e9c46a','plate':'#b8c0cc','pwr':'#f4a261','feat':'#5fa8d3','top':'#8fc9a0','free':'#f4f4f4','hyd':'#c9a0dc','sht':'#e76f51'}
o=[]
def R(x,y,w,h,fill,stroke='#333',sw=1,dash=None,rx=0):
    d=f' stroke-dasharray="{dash}"' if dash else ''
    o.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" rx="{rx}"{d}/>')
def T(x,y,s,sz=11,anchor='start',w='normal',fill='#222'):
    o.append(f'<text x="{x:.1f}" y="{y:.1f}" font-size="{sz}" text-anchor="{anchor}" font-weight="{w}" fill="{fill}" font-family="Helvetica,Arial,sans-serif">{s}</text>')
def panel(i,title,sub,layers,note,used):
    ox=X0+i*PW; base=Y0+H*S
    T(ox+W*S/2,Y0-48,title,14,'middle','bold'); T(ox+W*S/2,Y0-32,sub,10.5,'middle',fill='#555')
    R(ox,Y0,W*S,H*S,'#fff','#222',2.2,rx=6)
    for (y0,h,kind,label,*ex) in layers:
        x=ox+3; w=W*S-6
        if ex and ex[0]=='cells_up':
            R(x,base-(y0+h)*S,w,h*S,C['free'],'none')
            for k in (0,1):
                cx=ox+W*S/2+(k-0.5)*(33.4*S+8)
                R(cx-16.7*S,base-(y0+h)*S,33.4*S,h*S,C['cell'],'#8a6d00',1.2,rx=8)
            T(ox+W*S/2,base-(y0+h/2)*S+4,label,10,'middle','bold')
        elif ex and ex[0]=='cells_flat':
            for k,yy in enumerate((0,)):
                R(ox+W*S/2-30.8*S,base-(y0+h)*S,61.6*S,h*S,C['cell'],'#8a6d00',1.2,rx=10)
            T(ox+W*S/2,base-(y0+h/2)*S+4,label,10,'middle','bold')
        elif ex and ex[0]=='side3':
            cw=33.4*S
            for cx in (ox+8,ox+W*S-8-cw):
                R(cx,base-(y0+h)*S,cw,h*S,C['cell'],'#8a6d00',1.2,rx=8)
            T(cx:=ox+8+cw/2,base-(y0+h/2)*S+4,'D cell',10,'middle','bold'); T(ox+W*S-8-cw/2,base-(y0+h/2)*S+4,'D cell',10,'middle','bold')
            # standing stack in the middle
            sx=ox+8+cw+4; sw=W*S-16-2*cw-8
            R(sx,base-(y0+51)*S,sw,51*S,C['feat'],'#1d5a85',1.2)
            T(sx+sw/2,base-(y0+30)*S,'M0',9,'middle'); T(sx+sw/2,base-(y0+30)*S+11,'Adalog.',9,'middle'); T(sx+sw/2,base-(y0+30)*S+22,'Proto',9,'middle')
            T(sx+sw/2,base-(y0+51)*S-4,'stack on edge',8.5,'middle',fill='#1d5a85')
        else:
            fill=C[kind]; R(x,base-(y0+h)*S,w,h*S,fill,'#555',1)
            if h*S>11: T(ox+W*S/2,base-(y0+h/2)*S+4,label,10,'middle','bold' if kind in('feat','cell') else 'normal')
            elif label: T(ox+W*S/2,base-(y0+h/2)*S+3.5,label,8.5,'middle')
    # lid zone hatched
    R(ox,Y0-18,W*S,18,'#dcdcdc','#222',1.4); T(ox+W*S/2,Y0-5,'lid / cap: depth not recorded',9,'middle',fill='#444')
    # ruler
    R(ox-26,Y0,6,H*S,'none','#999',0.6)
    u=base-used*S
    o.append(f'<line x1="{ox-30}" y1="{u:.1f}" x2="{ox+W*S}" y2="{u:.1f}" stroke="#d00" stroke-width="1" stroke-dasharray="4 3"/>')
    T(ox-32,u+4,f'{used:g}','10','end',fill='#d00')
    T(ox+W*S/2,Y0+H*S+18,note[0],10.5,'middle','bold'); 
    for j,l in enumerate(note[1:]): T(ox+W*S/2,Y0+H*S+33+13*j,l,9.5,'middle',fill='#444')
tab=3
A=[(0,4,'plate','floor tray'),(4,61.6,'cell','2 × D cell upright','cells_up'),(65.6,3,'plate','plate'),(68.6,7,'pwr','diodes + PTC + JST'),(75.6,3,'plate','plate'),(78.6,30,'feat','Feather + Adalogger + Proto'),(108.6,12,'top','jack · terminal · Q/U'),(120.6,3,'plate','top deck')]
B=[(0,4,'plate','floor / cradle'),(4,33.4,'cell','2 × D cell on its side','cells_flat'),(37.4,3,'plate','plate'),(40.4,7,'pwr','diodes + PTC + JST'),(47.4,3,'plate','plate'),(50.4,30,'feat','Feather + Adalogger + Proto'),(80.4,12,'top','jack · terminal · Q/U'),(92.4,3,'plate','top deck'),(95.4,9,'sht','SHT40 · desiccant')]
Cc=[(0,4,'plate','floor / cradle'),(4,33.4,'cell','2 × D cell on its side','cells_flat'),(37.4,7,'pwr','diodes + PTC + JST in the cradle ends'),(44.4,3,'plate','plate'),(47.4,30,'feat','Feather + Adalogger + Proto'),(77.4,12,'top','jack · terminal · Q/U'),(89.4,3,'plate','top deck'),(92.4,9,'sht','SHT40 · desiccant')]
D=[(0,4,'plate','floor frame'),(4,61.6,'cell','','side3'),(65.6,3,'plate','plate / top of layer 1'),(68.6,12,'top','jack · terminal · Q/U (deck 2)'),(80.6,9,'sht','SHT40 · desiccant · diodes · PTC')]
panel(0,'A · Flat tower, cells upright','simplest rule: one slab per function',A,('~124 of 127 mm: no margin','battery slab is the tallest, 66 mm','needs the whole 127 mm to be cavity'),123.6)
panel(1,'B · Flat tower, cells on their side','low battery slab, lowest centre of gravity',B,('~104 of 127 mm: 23 mm spare','cells 62 × 67 mm in plan (fits ⌀112)','power plumbing gets its own slab'),104.4)
panel(2,'C · B, with power plumbing in the cradle','fewest layers, most CAD work in layer 1',Cc,('~101 of 127 mm: 26 mm spare','diodes, PTC, JST sit at the cell tab ends','4 printed layers instead of 5'),101.4)
panel(3,'D · Cells flank a standing Feather stack','everything heavy in the bottom 70 mm',D,('~90 of 127 mm: 37 mm spare','stack stands on its 51 mm edge','103 mm across: tight, ~4 mm each side'),89.6)
T(X0,26,'S.C.O.U.T. electronics housing: four stackable packaging options (side sections, to scale, 2.3 px/mm)',16,'start','bold')
T(X0,46,'Housing 111.8 mm ID × 127 mm tall (decided 2026-10-08; cavity vs clamp bore not recorded). Red dashed line = height used (mm). Stack ≈30 mm and D cell Ø33.4 × 61.6 mm are unverified.',10.5,fill='#555')
svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{X0+4*PW+20}" height="{Y0+H*S+110}" viewBox="0 0 {X0+4*PW+20} {Y0+H*S+110}"><rect width="100%" height="100%" fill="#fff"/>'+''.join(o)+'</svg>'
open('../../../assets/diagrams/electronics-packaging-options-2026-10-15.svg','w').write(svg)
print(len(svg))
