import * as THREE from 'three';
/** Local +Z points forward. Wheel pivots support steering and tire rotation. */
export function createF1Car(color:THREE.ColorRepresentation,isPlayer=false):THREE.Group{
 const g=new THREE.Group();g.name='Formula race car';
 const mat=(color:THREE.ColorRepresentation,r=.4,m=.3)=>new THREE.MeshStandardMaterial({color,roughness:r,metalness:m});
 const paint=mat(color,.28,.45),carbon=mat('#151a20'),rubber=mat('#171719',.95,0),alloy=mat('#9aa5aa',.25,.85),white=mat('#eceee5');
 const add=(geo:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=g)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const rod=(a:THREE.Vector3,b:THREE.Vector3,r=.035)=>{const o=add(new THREE.CylinderGeometry(r,r,a.distanceTo(b),8),carbon,0,0,0);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());};
 box(1.9,.1,4.9,carbon,0,.28,-.1);box(.94,.47,2.8,paint,0,.61,-.15);
 const nose=add(new THREE.CylinderGeometry(.19,.43,2.5,4),paint,0,.57,1.32);nose.rotation.x=Math.PI/2;nose.rotation.z=Math.PI/4;nose.scale.z=.65;
 for(const side of [-1,1]){box(.59,.48,1.65,paint,side*.67,.55,-.55).rotation.y=side*.07;box(.48,.23,.035,carbon,side*.66,.66,.29);box(.57,.06,1.5,white,side*.69,.81,-.6);box(.12,.23,.2,paint,side*.61,1.05,.45);rod(new THREE.Vector3(side*.42,.9,.32),new THREE.Vector3(side*.61,1.05,.45),.022);}
 const cockpit=add(new THREE.SphereGeometry(.46,20,12),carbon,0,.89,-.2);cockpit.scale.set(.83,.32,1.3);
 add(new THREE.SphereGeometry(.23,16,12),mat(isPlayer?'#fff3d0':'#f39c42',.25),0,1.04,-.21);
 add(new THREE.SphereGeometry(.235,16,8,0,Math.PI*2,Math.PI*.37,Math.PI*.22),mat('#111e2a',.12,.8),0,1.05,-.21);
 const halo=add(new THREE.TorusGeometry(.43,.035,8,24,Math.PI*1.65),carbon,0,1.2,-.12);halo.rotation.x=Math.PI/2;halo.rotation.z=-Math.PI*.325;halo.scale.y=1.35;rod(new THREE.Vector3(0,.79,.58),new THREE.Vector3(0,1.2,.43));
 for(const side of [-1,1])rod(new THREE.Vector3(side*.3,.88,-.77),new THREE.Vector3(0,1.47,-.81),.055);
 const engine=add(new THREE.ConeGeometry(.45,1.8,4),paint,0,.82,-1.15);engine.rotation.x=-Math.PI/2;engine.rotation.z=Math.PI/4;engine.scale.z=.8;box(.13,.57,1.05,paint,0,1.02,-1.42);
 for(const z of [2.25,2.48])box(2.76,.055,.23,carbon,0,.28,z);
 for(const side of [-1,1]){box(.065,.32,.68,paint,side*1.36,.39,2.34);box(.07,.49,.64,carbon,side*1.12,1.12,-2.18);box(.065,.63,.12,carbon,side*.34,.73,-2.16);}
 for(const y of [1.09,1.26])box(2.28,.07,.53,paint,0,y,-2.18).rotation.x=-.12;
 box(.17,.12,.08,new THREE.MeshBasicMaterial({color:'#ff3325'}),0,.55,-2.57);
 const wheels:THREE.Group[]=[],frontWheels:THREE.Group[]=[];const tire=new THREE.CylinderGeometry(.48,.48,.44,24),rim=new THREE.CylinderGeometry(.265,.265,.46,16),ring=new THREE.TorusGeometry(.385,.014,5,24),yellow=new THREE.MeshBasicMaterial({color:'#e5cf46'});
 for(const side of [-1,1])for(const z of [-1.55,1.6]){const pivot=new THREE.Group();pivot.position.set(side*1.12,.48,z);g.add(pivot);const rotation=new THREE.Group();pivot.add(rotation);wheels.push(rotation);if(z>0)frontWheels.push(pivot);add(tire,rubber,0,0,0,rotation).rotation.z=Math.PI/2;add(rim,alloy,0,0,0,rotation).rotation.z=Math.PI/2;add(ring,yellow,side*.225,0,0,rotation).rotation.y=Math.PI/2;for(const y of [.32,.61])for(const dz of [-.29,.29])rod(new THREE.Vector3(side*.4,y,z+dz),new THREE.Vector3(side*1.08,.48,z),.025);}
 g.userData.wheels=wheels;g.userData.frontWheels=frontWheels;return g;
}
