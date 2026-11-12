import re,sys,math
import numpy as np
def load(c):
    t=None;T=[];A=[];Z=[]
    for l in open(c+'/log.interFoam'):
        m=re.match(r'^Time = ([\d.e+-]+)$',l)
        if m: t=float(m.group(1));continue
        m=re.search(r'Orientation: \(([^)]*)\)',l)
        if m and t is not None:
            R=list(map(float,m.group(1).split()))
            T.append(t);A.append(math.degrees(math.atan2(R[2],R[0])))
        m=re.search(r'Centre of rotation: \(([^)]*)\)',l)
        if m: Z.append(float(m.group(1).split()[2]))
    T=np.array(T);A=np.array(A)
    # keep last per time
    u={}
    for a,b in zip(T,A):u[a]=b
    T=np.array(sorted(u));A=np.array([u[k] for k in T])
    return T,A
for c in ['rolldecay-nofins','rolldecay-fins']:
    T,A=load(c)
    n=len(T)
    # extrema
    ex=[(T[i],A[i]) for i in range(1,n-1) if (A[i]-A[i-1])*(A[i+1]-A[i])<0]
    print(c,'steps',n,'A0',A[0],'min/max',A.min(),A.max())
    print(' extrema',[(round(a,3),round(b,2)) for a,b in ex[:12]])
    pk=[abs(b) for a,b in ex]
    if len(ex)>=3:
        per=2*np.mean(np.diff([a for a,b in ex]))
        print(' period ~',round(per,3),'s')
        d=[math.log(pk[i]/pk[i+2]) for i in range(len(pk)-2) if pk[i+2]>0.05]
        if d: print(' log-dec per full cycle',np.round(d,3),' zeta~',round(np.mean(d)/(2*math.pi),3))
