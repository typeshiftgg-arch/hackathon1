import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Login({ onLogin }: { onLogin: (name: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.setClearColor(0x06090d, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090d);
    scene.fog = new THREE.FogExp2(0x06090d, 0.022);

    const camera = new THREE.PerspectiveCamera(40, W()/H(), 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    // ── LIGHTS ──
    scene.add(new THREE.AmbientLight(0x0a1510, 4));

    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(5, 10, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048,2048);
    scene.add(sun);

    // Main green glow — centred above bag
    const gl1 = new THREE.PointLight(0x00ff55, 35, 12);
    gl1.position.set(0, 5, 2);
    scene.add(gl1);

    const gl2 = new THREE.PointLight(0x00ff55, 15, 8);
    gl2.position.set(0, -1, 2);
    scene.add(gl2);

    const gl3 = new THREE.PointLight(0x00cc44, 10, 7);
    gl3.position.set(-3, 2, 0);
    scene.add(gl3);

    // White specular hotspot
    const spec = new THREE.PointLight(0xffffff, 20, 5);
    spec.position.set(-1.8, 3, 4);
    scene.add(spec);

    const rim = new THREE.PointLight(0x00ff88, 8, 7);
    rim.position.set(3, 4, -3);
    scene.add(rim);

    // ── MATERIALS ──
    const greenGlowMat = new THREE.MeshStandardMaterial({
      color: 0x00ff55,
      emissive: 0x00ff55,
      emissiveIntensity: 5,
      roughness: 1,
    });

    const coinBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x040c07,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      roughness: 0.05,
      metalness: 0.2,
      emissive: 0x001508,
      emissiveIntensity: 0.4,
    });

    // ── COIN TEXTURE (₹ face) ──
    function makeCoinTex(sz=512) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = sz;
      const ctx = cv.getContext('2d');
      if (!ctx) return null;
      const g = ctx.createRadialGradient(sz/2,sz/2,sz*0.05,sz/2,sz/2,sz*0.48);
      g.addColorStop(0,'#0b2014'); g.addColorStop(1,'#040c07');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(sz/2,sz/2,sz*0.47,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#00ff55'; ctx.lineWidth=sz*0.028;
      ctx.shadowColor='#00ff55'; ctx.shadowBlur=sz*0.06;
      ctx.beginPath(); ctx.arc(sz/2,sz/2,sz*0.44,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='#00ff55';
      ctx.font=`bold ${sz*0.42}px Georgia,serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('₹',sz/2,sz*0.54);
      return new THREE.CanvasTexture(cv);
    }
    const coinTex = makeCoinTex(512);

    // ── FALLING COINS ──
    const falling: THREE.Group[] = [];
    function spawnCoin(){
      const g=new THREE.Group();
      const r=0.13+Math.random()*0.2;
      g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(r,r,r*0.2,20),coinBodyMat)));
      const er2=new THREE.Mesh(new THREE.TorusGeometry(r,0.025,6,20),greenGlowMat);
      er2.rotation.x=Math.PI/2; g.add(er2);
      const fGeo2=new THREE.CircleGeometry(r-0.02,20);
      const fMat2=new THREE.MeshBasicMaterial({map:coinTex || undefined,transparent:true,depthWrite:false});
      const f2=new THREE.Mesh(fGeo2,fMat2);
      f2.rotation.x=-Math.PI/2; f2.position.y=r*0.11; g.add(f2);

      g.position.set((Math.random()-0.5)*10, 8+Math.random()*6, (Math.random()-0.5)*4);
      g.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      g.userData={
        vy:-(0.035+Math.random()*0.055),
        vx:(Math.random()-0.5)*0.01,
        vz:(Math.random()-0.5)*0.007,
        vrx:(Math.random()-0.5)*0.05,
        vry:(Math.random()-0.5)*0.05,
        vrz:(Math.random()-0.5)*0.05,
      };
      scene.add(g); falling.push(g);
    }
    // seed initial coins
    for(let i=0;i<20;i++){
      spawnCoin();
      falling[i].position.y = (Math.random()-0.5)*18;
    }
    const interval = setInterval(spawnCoin,260);

    // ── PARTICLES ──
    const pN=500, pBuf=new Float32Array(pN*3);
    for(let i=0;i<pN;i++){
      pBuf[i*3]=(Math.random()-0.5)*18;
      pBuf[i*3+1]=(Math.random()-0.5)*14;
      pBuf[i*3+2]=(Math.random()-0.5)*7;
    }
    const pGeo=new THREE.BufferGeometry();
    pGeo.setAttribute('position',new THREE.BufferAttribute(pBuf,3));
    scene.add(new THREE.Points(pGeo,new THREE.PointsMaterial({
      color:0x00ff55,size:0.02,transparent:true,opacity:0.3,
    })));

    // ── MOUSE ──
    let mx=0,my=0,tmx=0,tmy=0;
    const handleMouseMove = (e: MouseEvent) => {
      mx=(e.clientX/W()-0.5)*2;
      my=(e.clientY/H()-0.5)*2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect=W()/H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(),H());
    };
    window.addEventListener('resize', handleResize);

    // ── ANIMATE ──
    let t=0;
    let animationId: number;
    function animate(){
      animationId = requestAnimationFrame(animate);
      t+=0.01;

      // smooth parallax
      tmx+=(mx-tmx)*0.035; tmy+=(my-tmy)*0.035;
      camera.position.x=tmx*0.9;
      camera.position.y=0-tmy*0.45;
      camera.lookAt(0,0,0);

      // falling coins
      for(let i=falling.length-1;i>=0;i--){
        const fc=falling[i];
        fc.position.y+=fc.userData.vy;
        fc.position.x+=fc.userData.vx;
        fc.position.z+=fc.userData.vz;
        fc.rotation.x+=fc.userData.vrx;
        fc.rotation.y+=fc.userData.vry;
        fc.rotation.z+=fc.userData.vrz;
        if(fc.position.y<-6){ scene.remove(fc); falling.splice(i,1); }
      }

      // glow pulse
      const p=Math.sin(t*2.0)*0.3+1;
      gl1.intensity=35*p;
      gl2.intensity=15*p;
      gl3.intensity=10*p;

      renderer.render(scene,camera);
    }
    animate();

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans text-[#eef2ee] bg-[#06090d]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        
        :root{
          --g:#00ff55;
          --g2:#00cc44;
          --bg:#06090d;
          --t:#eef2ee;
          --tm:rgba(238,242,238,0.45);
        }

        .vignette{
          position:fixed;inset:0;z-index:1;
          background:radial-gradient(ellipse 80% 90% at 50% 50%, transparent 30%, rgba(6,9,13,0.75) 100%);
          pointer-events:none;
        }

        .scanlines{
          position:fixed;inset:0;z-index:2;
          background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px);
          pointer-events:none;
        }

        .logo{
          font-family:'Syne',sans-serif;
          font-weight:800;
          font-size:clamp(16px,1.8vw,22px);
          letter-spacing:-0.3px;
          display:flex;align-items:center;gap:9px;
          color:var(--t);
          opacity:0;animation:fadeIn .6s .1s forwards;
        }
        .logo-pip{
          width:7px;height:7px;
          border-radius:50%;
          background:var(--g);
          box-shadow:0 0 10px var(--g),0 0 22px rgba(0,255,85,.4);
          animation:pip 2.4s ease-in-out infinite;
        }
        @keyframes pip{
          0%,100%{box-shadow:0 0 8px var(--g),0 0 18px rgba(0,255,85,.3);}
          50%{box-shadow:0 0 14px var(--g),0 0 32px rgba(0,255,85,.55);}
        }

        .hero{
          position:fixed;
          top:50%; left:50%;
          transform:translate(-50%,-50%);
          z-index:20;
          text-align:center;
          max-width:min(640px, 88vw);
          pointer-events:none;
        }

        .hero-tag{
          display:inline-flex;align-items:center;gap:7px;
          border:1px solid rgba(0,255,85,.18);
          background:rgba(0,255,85,.04);
          padding:5px 13px 5px 7px;
          border-radius:100px;
          margin-bottom:24px;
          opacity:0;animation:fadeUp .7s .5s forwards;
        }
        .hero-tag-dot{
          width:5px;height:5px;border-radius:50%;
          background:var(--g);box-shadow:0 0 8px var(--g);
          animation:pip 2s infinite;
        }
        .hero-tag span{
          font-size:10px;font-weight:500;
          letter-spacing:1.2px;text-transform:uppercase;
          color:var(--g);
        }

        .hero-title{
          font-family:'Syne',sans-serif;
          font-weight:800;
          font-size:clamp(32px,5.5vw,72px);
          line-height:.96;
          letter-spacing:-2px;
          margin-bottom:20px;
          opacity:0;animation:fadeUp .7s .7s forwards;
        }
        .hero-title em{
          font-style:normal;
          color:var(--g);
          text-shadow:0 0 40px rgba(0,255,85,.35);
        }

        .hero-sub{
          font-size:clamp(13px,1.3vw,16px);
          font-weight:300;
          color:var(--tm);
          line-height:1.7;
          margin-bottom:32px;
          opacity:0;animation:fadeUp .7s .9s forwards;
        }

        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      <canvas ref={canvasRef} id="c" className="fixed inset-0 w-full h-full z-0 block"></canvas>
      <div className="vignette"></div>
      <div className="scanlines"></div>

      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-[clamp(18px,3vh,28px)_clamp(24px,5vw,64px)]">
        <div className="logo">
          <div className="logo-pip"></div>
          PaisaPulse
        </div>
      </nav>

      <section className="hero flex flex-col items-center">
        <div className="hero-tag">
          <div className="hero-tag-dot"></div>
          <span>AI Finance Guardian</span>
        </div>
        <h1 className="hero-title">
          Guard your<br/><em>Paisa.</em><br/>Own your future.
        </h1>
        <p className="hero-sub">
          Real-time behavioral nudges that stop impulsive spending before it happens — powered by Gemini AI.
        </p>

        <div className="mt-8 w-full max-w-xs space-y-4 opacity-0 animate-[fadeUp_0.7s_1.1s_forwards] pointer-events-auto">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#0d1219]/80 border border-[#00ff55]/30 rounded-xl px-4 py-3 text-[#eef2ee] placeholder:text-[#eef2ee]/30 focus:outline-none focus:border-[#00ff55] transition-colors text-center font-dm"
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && onLogin(name)}
          />
          <button 
            onClick={() => name.trim() && onLogin(name)}
            disabled={!name.trim()}
            className="w-full bg-[#00ff55] hover:bg-[#00cc44] disabled:opacity-50 disabled:cursor-not-allowed text-[#06090d] px-6 py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-wider font-syne"
          >
            Enter Terminal
          </button>
        </div>
      </section>
    </div>
  );
}
