class Point{constructor(e,t){this.x=e,this.y=t}}class DPoint{constructor(e,t,n){this.x=e,this.y=t,this.direction=n}}class PathData{constructor(e,t,n,s){this.segments=e,this.isHole=t,this.holeChildren=n,this.ignore=s}}const defaultOptions={filterHoles:0,enhanceCorners:!0,lineTolerance:1,splineTolerance:1,mergePaths:!0,precision:1,strokeWidth:1};function detectEdges(e,t,n,s){const o=new Array(s.length);for(let e=0;e<s.length;e++)o[e]=new Uint8Array(t*n);for(let a=1;a<n-1;a++){const s=a*t,r=s-t,i=s+t;for(let a=1;a<t-1;a++){const n=e[s+a],d=a-1,c=a+1,b=e[r+d]===n?1:0,h=e[r+a]===n?2:0,p=e[r+c]===n?2:0,m=e[s+d]===n?8:0,f=e[s+c]===n?1:0,g=e[i+d]===n?8:0,u=e[i+a]===n?1:0,v=e[i+c]===n?4:0,l=o[n];l[i+c]=1+f*2+v+u*8,m===0&&(l[i+a]=2+u*4+g),h===0&&(l[s+c]=p+f*4+8),b===0&&(l[s+a]=h+4+m)}}return o}function createBorderedInt16Array(e,t,n){const o=t+2,i=n+2,a=o*i,s=new Int16Array(a);for(let i=0;i<n;i++){const a=i*t,r=(i+1)*o;for(let n=0;n<t;n++)s[r+n+1]=e[a+n]}for(let e=0;e<i;e++){const n=e*o;s[n]=-1,s[n+t+1]=-1}const r=a-o;for(let e=1;e<t+1;e++)s[e]=-1,s[r+e]=-1;return s}class Path{points=[];holeChildren=[];ignore=!1;constructor(e,t,n){this.boundingBox=[e,t,e,t],this.isHole=n}}const lookupTables=[[[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1]],[[0,1,0,-1],[-1,-1,-1,-1],[-1,-1,-1,-1],[0,2,-1,0]],[[-1,-1,-1,-1],[-1,-1,-1,-1],[0,1,0,-1],[0,0,1,0]],[[0,0,1,0],[-1,-1,-1,-1],[0,2,-1,0],[-1,-1,-1,-1]],[[-1,-1,-1,-1],[0,0,1,0],[0,3,0,1],[-1,-1,-1,-1]],[[13,3,0,1],[13,2,-1,0],[7,1,0,-1],[7,0,1,0]],[[-1,-1,-1,-1],[0,1,0,-1],[-1,-1,-1,-1],[0,3,0,1]],[[0,3,0,1],[0,2,-1,0],[-1,-1,-1,-1],[-1,-1,-1,-1]],[[0,3,0,1],[0,2,-1,0],[-1,-1,-1,-1],[-1,-1,-1,-1]],[[-1,-1,-1,-1],[0,1,0,-1],[-1,-1,-1,-1],[0,3,0,1]],[[11,1,0,-1],[14,0,1,0],[14,3,0,1],[11,2,-1,0]],[[-1,-1,-1,-1],[0,0,1,0],[0,3,0,1],[-1,-1,-1,-1]],[[0,0,1,0],[-1,-1,-1,-1],[0,2,-1,0],[-1,-1,-1,-1]],[[-1,-1,-1,-1],[-1,-1,-1,-1],[0,1,0,-1],[0,0,1,0]],[[0,1,0,-1],[-1,-1,-1,-1],[-1,-1,-1,-1],[0,2,-1,0]],[[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1]]];function scanPaths(e,t,n){const s=[];for(let o=0;o<n;o++){const i=o*t;for(let n=0;n<t;n++){const r=i+n,a=e[r];if(a===4||a===11){const i=scanPath(e,n,o,t);i&&(s.push(i),updateParent(s,i))}}}return s}function scanPath(e,t,n,s){let o=n*s+t;const r=e[o]===11,i=new Path(t,n,r);let a=1;for(;!0;){const c=t-1,l=n-1,d=new Point(c,l);i.points.push(d),updateBoundingBox(i.boundingBox,c,l);const r=lookupTables[e[o]][a];if(e[o]=r[0],a=r[1],t+=r[2],n+=r[3],o=n*s+t,isClosePath(t,n,i.points[0]))return i}}function updateBoundingBox(e,t,n){t<e[0]&&(e[0]=t),t>e[2]&&(e[2]=t),n<e[1]&&(e[1]=n),n>e[3]&&(e[3]=n)}function isClosePath(e,t,n){return e-1===n.x&&t-1===n.y}function containsBoundingBox(e,t){return!(e[0]>t[0])&&!(e[1]>t[1])&&!(e[2]<t[2])&&!(e[3]<t[3])}function isPointInPolygon(e,t){let n=!1;const o=t.length,{x:i,y:s}=e;for(let e=0,r=o-1;e<o;r=e++){const c=t[e],l=t[r],d=c.x,a=c.y,h=l.x,u=l.y,m=a>s!==u>s&&i<(h-d)*(s-a)/(u-a)+d;m&&(n=!n)}return n}function updateParent(e,t){if(!t.isHole)return;const n=e.length-1;let s=0;for(let o=0;o<n;o++){const i=e[o],r=t.boundingBox;let a=i.boundingBox;!i.isHole&&containsBoundingBox(a,r)&&isPointInPolygon(t.points[0],i.points)&&(s=o,a=i.boundingBox)}e[s].holeChildren.push(n)}function filterHoles(e,t,n,s){const{filterHoles:o}=s;if(o<=0)return;for(let s=0;s<n.length;s++){const i=n[s];for(let a=0;a<i.length;a++){const s=i[a];if(!s.isHole)continue;if(o<s.points.length)continue;s.ignore=!0;const c=s.boundingBox,r=getColorIndexes(e,t,s);for(let e=0;e<r.length;e++){const t=n[r[e]];for(let e=0;e<t.length;e++){const n=t[e];if(o<n.points.length)continue;const s=n.boundingBox;containsBoundingBox(c,s)&&(n.ignore=!0)}}}}}function createMask(e,t,n,s,o){function a(e,n){e=e-s+1,n=n-o+1,c[n*t+e]=1}const c=new Uint8Array(t*n),r=e.points;let i=r[0];for(let t=1;t<=r.length;t++){const e=r[t%r.length];i.x===e.x?i.y<e.y?a(e.x-1,i.y):a(e.x,i.y-1):i.x<e.x?a(e.x-1,e.y):a(i.x-1,e.y-1),i=e}return c}function floodFill(e,t,n,s,o){const a=o*t+s;if(e[a]>0)return;const i=[[s,o]];for(;i.length>0;){const[s,o]=i.pop();if(s<0)continue;if(t<=s)continue;if(o<0)continue;if(n<=o)continue;const a=o*t+s;if(1<=e[a])continue;e[a]=255,i.push([s+1,o]),i.push([s-1,o]),i.push([s,o+1]),i.push([s,o-1])}}function getColorIndexesFromMask(e,t,n,s,o,i){const a=new Set,r=i.boundingBox,c=r[0]-1,l=r[1]-1;for(let i=1;i<o-1;i++)for(let o=1;o<s-1;o++)if(n[i*s+o]<255){const n=e[(l+i)*t+c+o];a.add(n)}return Array.from(a)}function getColorIndexes(e,t,n){if(n.points.length<12){const{x:s,y:o}=n.points[0],i=e[o*t+s];return[i]}const[i,a,c,l]=n.boundingBox,s=c-i+2,o=l-a+2,r=createMask(n,s,o,i,a);floodFill(r,s,o,0,0);const d=getColorIndexesFromMask(e,t,r,s,o,n);return d}function smoothPaths(e,t=defaultOptions){const n=new Array(e.length);for(let i=0;i<e.length;i++){const a=[];n[i]=a;const s=e[i].points,o=s.length;for(let e=0;e<o;e++){const m=s[e],{x:i,y:n}=m,c=s[(e+1)%o],l=s[(e+2)%o],u=c.x,h=c.y,r=(i+u)/2,d=(n+h)/2;if(t.enhanceCorners){const t=e+o,u=s[(t-1)%o],h=s[(t-2)%o],f=[h,u,m,c,l];if(isCorner(f)){if(e>0){const e=a.at(-1);e.direction=getDirection(e.x,e.y,i,n)}const t=getDirection(i,n,r,d),s=new DPoint(i,n,t);a.push(s)}}const f=l.x,p=l.y,g=(u+f)/2,v=(h+p)/2,b=getDirection(r,d,g,v),j=new DPoint(r,d,b);a.push(j)}}return n}function isCorner(e){const[s,o,i,a,r]=e,t=i.x,n=i.y;return t===s.x&&t===o.x&&n===a.y&&n===r.y||n===s.y&&n===o.y&&t===a.x&&t===r.x}function getDirection(e,t,n,s){return e<n?t<s?1:t>s?7:0:e>n?t<s?3:t>s?5:4:t<s?2:t>s?6:8}class FitStatus{constructor(e,t,n){this.status=e,this.errorPos=t,this.maxError=n}}function trace(e,t=defaultOptions){const s=[];let n=0;for(;n<e.length;){const o=findSequenceEnd(e,n);s.push(...fit(e,n,o,t)),n=o>0?o:e.length}return s}function findSequenceEnd(e,t){const o=e[t].direction;let s=-1,n;for(n=t+1;n<e.length;n++){const i=e[n].direction;if(i===o)continue;if(s===-1)s=i;else if(i!==s)break}return n>=e.length-1?0:n}function fit(e,t,n,s=defaultOptions){const o=e.length;if(n>o||n<0)return[];const i=(n-t+o)%o,r=e[t],c=e[n],l=checkStraightLine(e,t,n,i,s.lineTolerance);if(l.status)return svgStraightLine(r,c);const a=l.errorPos,d=calculateControlPoint(e,t,n,a,i),m=checkSpline(e,t,a,n,d,i,s.splineTolerance);if(m.status)return svgSpline(r,d,c);const u=a,h=fit(e,t,u,s);return h.push(...fit(e,u,n,s)),h}function svgStraightLine(e,t){return[{type:"L",x1:e.x,y1:e.y,x2:t.x,y2:t.y}]}function svgSpline(e,t,n){return[{type:"Q",x1:e.x,y1:e.y,x2:t.x,y2:t.y,x3:n.x,y3:n.y}]}function checkStraightLine(e,t,n,s,o){const a=e.length,r=e[t],l=e[n],h=(l.x-r.x)/s,m=(l.y-r.y)/s;let i=(t+1)%a,d=!0,u=t,c=0;for(;i!==n;){const s=e[i],l=(i-t+a)%a,f=r.x+h*l,p=r.y+m*l,n=(s.x-f)**2+(s.y-p)**2;n>o&&(d=!1),n>c&&(u=i,c=n),i=(i+1)%a}return new FitStatus(d,u,c)}function calculateControlPoint(e,t,n,s,o){const i=(s-t)/o,a=1-i,r=a**2,c=2*a*i,l=i**2,d=e[t],u=e[s],h=e[n],m=(r*d.x+l*h.x-u.x)/-c,f=(r*d.y+l*h.y-u.y)/-c;return new Point(m,f)}function checkSpline(e,t,n,s,o,i,a){const h=e.length,l=e[t],d=e[s];let r=t+1,u=!0,c=0;for(;r!==s;){const f=e[r],s=(r-t)/i,p=1-s,g=p**2,v=2*p*s,b=s**2,j=g*l.x+v*o.x+b*d.x,y=g*l.y+v*o.y+b*d.y,m=(f.x-j)**2+(f.y-y)**2;m>a&&(u=!1),m>c&&(n=r,c=m),r=(r+1)%h}return new FitStatus(u,n,c)}function toSVGString(e,t=defaultOptions){const{mergePaths:i}=t,{layers:s,palette:o,width:a,height:r}=e,c=`viewBox="0 0 ${a} ${r}"`;let n=`<svg xmlns="http://www.w3.org/2000/svg" ${c}>`;if(i)for(let i=0;i<e.layers.length;i++){const a=s[i],c=toColorAttributes(o[i],t);let r="";for(let e=0;e<a.length;e++){const n=a[e];if(n.isHole)continue;r+=toData(n,a,t)}n+=`<path${c} d="${r}"/>`}else for(let i=0;i<e.layers.length;i++){const a=s[i],r=toColorAttributes(o[i],t);for(let e=0;e<a.length;e++){const s=a[e];if(s.isHole)continue;const o=toData(s,a,t);n+=`<path${r} d="${o}"/>`}}return n+="</svg>",n}function toColorString(e){const o=e>>16&255,i=e>>8&255,a=e&255,t=a.toString(16).padStart(2,"0"),n=i.toString(16).padStart(2,"0"),s=o.toString(16).padStart(2,"0");return t[0]===t[1]&&n[0]===n[1]&&s[0]===s[1]?`#${t[0]}${n[0]}${s[0]}`:`#${t}${n}${s}`}function toColorAttributes(e,t=defaultOptions){const{strokeWidth:o}=t,n=toColorString(e);let s;n==="#000"?s="":s=` fill="${n}"`;const i=o===0?"":` stroke="${n}" stroke-width="${o}"`;return s+i}function toData(e,t,n){let s=nonHoleData(e,n);return s+=holeChildrenData(e,t,n),s}function round(e,t=0){const n=Math.pow(10,t),s=e*n*(1+Number.EPSILON);return Math.round(s)/n}function nonHoleData(e,t=defaultOptions){if(e.ignore)return"";const{segments:n}=e,{precision:o}=t;let i="M",s="";if(o!==-1){const e=round(n[0].x1,o),t=round(n[0].y1,o);s=`M${e} ${t}`;for(let e=0;e<n.length;e++){const{type:t,x2:a,y2:r,x3:c,y3:d}=n[e],u=c===void 0?[a,r]:[a,r,c,d],l=u.map(e=>round(e,o)).join(" ");s+=i==t?" "+l:t+l,i=t}}else{const e=n[0].x1,t=n[0].y1;s=`M${e} ${t}`;for(let e=0;e<n.length;e++){const{type:t,x2:o,y2:a,x3:r,y3:l}=n[e],d=r===void 0?[o,a]:[o,a,r,l],c=d.join(" ");s+=i==t?" "+c:t+c,i=t}}return`${s}Z`}function getLastPoints(e){const{x3:t}=e;if(t===void 0){const{x2:t,y2:n}=e;return[t,n]}const{y3:n}=e;return[t,n]}function holeChildrenData(e,t,n=defaultOptions){const{holeChildren:i}=e;if(i.length===0)return"";const{precision:a}=n;let o="M",s="";if(a!==-1)for(let e=0;e<i.length;e++){const r=t[i[e]];if(r.ignore)continue;const n=r.segments,c=getLastPoints(n.at(-1)),l=round(c[0],a),d=round(c[1],a);s+=`M${l} ${d}`;for(let e=n.length-1;e>=0;e--){const{type:t,x1:i,y1:r,x2:l,y2:d,x3:u}=n[e],h=u===void 0?[i,r]:[l,d,i,r],c=h.map(e=>round(e,a)).join(" ");s+=o==t?" "+c:t+c,o=t}s+="Z",o="M"}else for(let e=0;e<i.length;e++){const a=t[i[e]];if(a.ignore)continue;const n=a.segments,r=getLastPoints(n.at(-1));s+=`M${r[0]} ${r[1]}`;for(let e=n.length-1;e>=0;e--){const{type:t,x1:i,y1:a,x2:c,y2:l,x3:d}=n[e],u=d===void 0?[i,a]:[c,l,i,a],r=u.join(" ");s+=o==t?" "+r:t+r,o=t}s+="Z",o="M"}return s}class TraceData{constructor(e,t,n,s){this.width=e,this.height=t,this.palette=n,this.layers=s}}function toSVG(e,t,n,s,o={}){o={...defaultOptions,...o};const i=toTraceData(e,t,n,s,o);return toSVGString(i,o)}function toTraceData(e,t,n,s,o={}){o={...defaultOptions,...o};const l=createBorderedInt16Array(e,t,n),r=t+2,c=n+2,i=detectEdges(l,r,c,s),a=new Array(s.length);for(let e=0;e<s.length;e++){const t=scanPaths(i[e],r,c,o);a[e]=t}filterHoles(e,t,a,o);for(let e=0;e<s.length;e++){const n=a[e],t=smoothPaths(n,o),r=new Array(t.length);for(let e=0;e<t.length;e++){const s=trace(t[e],o),{isHole:i,holeChildren:a,ignore:c}=n[e],l=new PathData(s,i,a,c);r[e]=l}i[e]=r}return new TraceData(t,n,s,i)}export{TraceData as TraceData};export{toSVG as toSVG};export{toTraceData as toTraceData}