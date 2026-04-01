import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

const DNA_COLORS = [
  0xff4858, // coral
  0xff6b7a, // light coral
  0xffb3ba, // rose pink
  0xffe0e3, // light rose
  0x4ecdc4, // teal
  0x45b7d1, // sky blue
  0x96ceb4, // sage green
  0xffeaa7, // soft yellow
];

export default function Landing3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    dnaGroup: THREE.Group;
    crosses: THREE.Group;
    particles: THREE.Points;
    animationId: number;
  } | null>(null);

  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const scrollProgress = useRef(0);
  const crossHoverData = useRef<Map<THREE.Group, { baseScale: number; targetScale: number }>>(new Map());

  const [typingText, setTypingText] = useState("");
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  const messages = [
    "Hello! I'm Avicenna, your AI health assistant. Ask me about any medication, drug interactions, or health concerns.",
    "Did you know? Aspirin was originally derived from willow bark and has been used for over 3,500 years!",
    "Always consult with a healthcare professional before starting any new medication. I'm here to help you understand your options.",
  ];
  const messageIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isDeletingRef = useRef(false);

  const createDNAHelix = useCallback((scene: THREE.Scene) => {
    const dnaGroup = new THREE.Group();
    const helixRadius = 2.5;
    const heightStep = 0.35;
    const twistsPerUnit = 0.25;
    const baseY = -12;
    const totalHeight = 24;

    const strand1Points: THREE.Vector3[] = [];
    const strand2Points: THREE.Vector3[] = [];

    for (let y = baseY; y <= baseY + totalHeight; y += heightStep) {
      const angle = (y - baseY) * twistsPerUnit * Math.PI * 2;
      strand1Points.push(
        new THREE.Vector3(Math.cos(angle) * helixRadius, y, Math.sin(angle) * helixRadius)
      );
      strand2Points.push(
        new THREE.Vector3(Math.cos(angle + Math.PI) * helixRadius, y, Math.sin(angle + Math.PI) * helixRadius)
      );
    }

    const curve1 = new THREE.CatmullRomCurve3(strand1Points);
    const curve2 = new THREE.CatmullRomCurve3(strand2Points);

    const tubeMaterial1 = new THREE.MeshPhongMaterial({
      color: 0xff4858,
      emissive: 0xff4858,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9,
    });

    const tubeMaterial2 = new THREE.MeshPhongMaterial({
      color: 0xff6b7a,
      emissive: 0xff6b7a,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9,
    });

    const tubeGeometry1 = new THREE.TubeGeometry(curve1, 200, 0.15, 12, false);
    const tubeGeometry2 = new THREE.TubeGeometry(curve2, 200, 0.15, 12, false);

    const strand1 = new THREE.Mesh(tubeGeometry1, tubeMaterial1);
    const strand2 = new THREE.Mesh(tubeGeometry2, tubeMaterial2);

    dnaGroup.add(strand1);
    dnaGroup.add(strand2);

    for (let i = 0; i < strand1Points.length; i++) {
      if (i % 3 === 0) {
        const crossCurve = new THREE.CatmullRomCurve3([strand1Points[i], strand2Points[i]]);
        const crossGeometry = new THREE.TubeGeometry(crossCurve, 8, 0.06, 8, false);
        const colorIndex = Math.floor(i / 3) % DNA_COLORS.length;
        const crossMaterial = new THREE.MeshPhongMaterial({
          color: DNA_COLORS[colorIndex],
          emissive: DNA_COLORS[colorIndex],
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.7,
        });
        const cross = new THREE.Mesh(crossGeometry, crossMaterial);
        dnaGroup.add(cross);
      }

      if (i % 2 === 0) {
        const colorIndex = i % DNA_COLORS.length;
        const nodeGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const nodeMaterial = new THREE.MeshPhongMaterial({
          color: DNA_COLORS[colorIndex],
          emissive: DNA_COLORS[colorIndex],
          emissiveIntensity: 0.5,
        });

        const node1 = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node1.position.copy(strand1Points[i]);
        dnaGroup.add(node1);

        const node2 = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
        node2.position.copy(strand2Points[i]);
        dnaGroup.add(node2);
      }
    }

    scene.add(dnaGroup);
    return dnaGroup;
  }, []);

  const createPharmacyCrosses = useCallback((scene: THREE.Scene) => {
    const crosses = new THREE.Group();

    const createCross = (x: number, y: number, z: number) => {
      const group = new THREE.Group();
      const material = new THREE.MeshPhongMaterial({
        color: 0xff4858,
        emissive: 0xff4858,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.85,
      });

      const barH = new THREE.BoxGeometry(1.2, 0.3, 0.3);
      const barV = new THREE.BoxGeometry(0.3, 1.2, 0.3);

      const hBar = new THREE.Mesh(barH, material);
      const vBar = new THREE.Mesh(barV, material);

      group.add(hBar);
      group.add(vBar);
      group.position.set(x, y, z);

      group.userData = {
        baseY: y,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.4,
        rotSpeed: 0.3 + Math.random() * 0.3,
      };

      crossHoverData.current.set(group, { baseScale: 1, targetScale: 1 });

      return group;
    };

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 7 + Math.random() * 4;
      const y = (Math.random() - 0.5) * 25;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      crosses.add(createCross(x, y, z));
    }

    scene.add(crosses);
    return crosses;
  }, []);

  const createParticles = useCallback((scene: THREE.Scene) => {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = 4 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = (Math.random() - 0.5) * 50;
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffb3ba,
      size: 0.12,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    return particles;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xff4858, 0.9);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xff4858, 0.7, 50);
    pointLight1.position.set(-15, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffb3ba, 0.5, 50);
    pointLight2.position.set(15, -10, 10);
    scene.add(pointLight2);

    const dnaGroup = createDNAHelix(scene);
    const crosses = createPharmacyCrosses(scene);
    const particles = createParticles(scene);

    sceneRef.current = { scene, camera, renderer, dnaGroup, crosses, particles, animationId: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
      }
    };

    const handleScroll = () => {
      scrollProgress.current = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    let time = 0;
    const animate = () => {
      if (!sceneRef.current) return;
      sceneRef.current.animationId = requestAnimationFrame(animate);
      time += 0.016;

      targetRotation.current.x = mouseRef.current.y * 0.25;
      targetRotation.current.y = mouseRef.current.x * 0.25;

      dnaGroup.rotation.x += (targetRotation.current.x - dnaGroup.rotation.x) * 0.05;
      dnaGroup.rotation.y += 0.015;

      crosses.children.forEach((cross) => {
        const data = cross.userData;
        const waveY = Math.sin(time * data.speed + data.phase) * 2.5;
        const waveX = Math.cos(time * data.speed * 0.5 + data.phase) * 1.5;
        cross.position.y = data.baseY + waveY;
        cross.position.x += (waveX - cross.position.x) * 0.05;
        cross.rotation.y = time * data.rotSpeed;

        const hoverData = crossHoverData.current.get(cross as THREE.Group);
        if (hoverData) {
          const scale = cross.scale.x + (hoverData.targetScale - cross.scale.x) * 0.1;
          cross.scale.setScalar(scale);
        }
      });

      particles.rotation.y += 0.0004;
      particles.rotation.x += 0.0001;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [createDNAHelix, createPharmacyCrosses, createParticles]);

  useEffect(() => {
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set([...prev, entry.target.id]));
        }
      });
    }, observerOptions);

    document.querySelectorAll("section").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const typeEffect = () => {
      const currentMessage = messages[messageIndexRef.current];

      if (isDeletingRef.current) {
        setTypingText(currentMessage.substring(0, charIndexRef.current - 1));
        charIndexRef.current--;
      } else {
        setTypingText(currentMessage.substring(0, charIndexRef.current + 1));
        charIndexRef.current++;
      }

      let typeSpeed = isDeletingRef.current ? 30 : 40;

      if (!isDeletingRef.current && charIndexRef.current === currentMessage.length) {
        typeSpeed = 3000;
        isDeletingRef.current = true;
      } else if (isDeletingRef.current && charIndexRef.current === 0) {
        isDeletingRef.current = false;
        messageIndexRef.current = (messageIndexRef.current + 1) % messages.length;
        typeSpeed = 500;
      }

      timeout = setTimeout(typeEffect, typeSpeed);
    };

    const avicennaSection = document.getElementById("avicenna");
    if (avicennaSection) {
      const avicennaObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(typeEffect, 800);
              avicennaObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      avicennaObserver.observe(avicennaSection);
      return () => avicennaObserver.disconnect();
    }

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fafafa]">
      <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" />

      <div className="relative z-10">
        <section id="hero" className="min-h-screen flex items-center justify-center px-5 pt-24" style={{ background: "linear-gradient(180deg, rgba(250,250,250,0.85) 0%, rgba(250,250,250,0.7) 50%, rgba(250,250,250,0.85) 100%)" }}>
          <div className={`text-center max-w-3xl mx-auto transition-all duration-1000 ${visibleSections.has("hero") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ffe0e3] to-white px-5 py-2 rounded-full text-sm font-medium text-[#ff4858] mb-8 border border-[#ffb3ba]">
              <span className="w-2 h-2 bg-[#ff4858] rounded-full animate-pulse" />
              Powered by Advanced AI
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-[#1a1a2e] via-[#ff4858] to-[#ff6b7a] bg-clip-text text-transparent">
              Find your medicine,<br />powered by AI
            </h1>
            <p className="text-xl text-gray-500 mb-12 max-w-xl mx-auto">
              Discover medications, locate nearby pharmacies, and get instant drug information — all through intelligent AI search.
            </p>
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                className="w-full px-6 py-5 pr-14 text-lg bg-white rounded-2xl border-2 border-transparent shadow-lg outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#ff4858] focus:shadow-[0_4px_40px_rgba(255,72,88,0.25)]"
                placeholder="Search for medications, symptoms, or conditions..."
              />
              <svg
                className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </section>

        <section id="features" className="min-h-screen flex items-center py-20 px-5" style={{ background: "linear-gradient(180deg, rgba(250,250,250,0.8) 0%, rgba(255,240,242,0.9) 50%, rgba(250,250,250,0.8) 100%)" }}>
          <div className="max-w-6xl mx-auto w-full">
            <h2 className={`text-4xl md:text-5xl font-semibold text-center mb-16 transition-all duration-1000 delay-200 ${visibleSections.has("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              Intelligent Healthcare Features
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
                    </svg>
                  ),
                  title: "AI Search",
                  desc: "Natural language search that understands medical queries. Find medications by name, symptom, or condition with intelligent recommendations.",
                  delay: 0,
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  ),
                  title: "Pharmacy Locator",
                  desc: "Find nearby pharmacies with real-time availability. Get directions, operating hours, and contact information at your fingertips.",
                  delay: 100,
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8">
                      <path d="M9 12h6M9 16h6M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                      <path d="M13 3v6h6" />
                    </svg>
                  ),
                  title: "Drug Information",
                  desc: "Comprehensive medication database with dosage guides, side effects, interactions, and contraindications verified by healthcare professionals.",
                  delay: 200,
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className={`bg-white p-8 rounded-3xl shadow-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#ff4858]/10 ${visibleSections.has("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                  style={{ transitionDelay: `${300 + feature.delay}ms` }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-[#ff4858] to-[#ffb3ba] rounded-2xl flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="avicenna" className="min-h-screen flex items-center py-20 px-5" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)" }}>
          <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
            <div className={`text-white transition-all duration-1000 ${visibleSections.has("avicenna") ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
              <h2 className="text-4xl md:text-5xl font-semibold mb-6">
                Meet <span className="text-[#ff4858]">Avicenna</span>
              </h2>
              <p className="text-lg text-white/70 leading-relaxed mb-8">
                Your personal AI health assistant, named after the legendary Persian physician Ibn Sina. Avicenna provides instant, accurate medication information and health guidance 24/7.
              </p>
              <div className="bg-white/5 rounded-2xl p-6 border-l-4 border-[#ff4858]">
                <p className="font-mono text-[#ffb3ba] text-sm leading-relaxed">
                  {typingText}
                  <span className="inline-block w-0.5 h-5 bg-[#ff4858] ml-1 animate-pulse align-middle" />
                </p>
              </div>
            </div>
            <div className={`flex items-center justify-center transition-all duration-1000 delay-300 ${visibleSections.has("avicenna") ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
              <div className="relative">
                <div className="w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-[#ff4858] to-[#ffb3ba] rounded-full flex items-center justify-center animate-[float_4s_ease-in-out_infinite]">
                  <div className="absolute inset-0 rounded-full bg-[#ff4858]/30 animate-[ping_3s_ease-in-out_infinite]" />
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-20 h-20 md:w-28 md:h-28">
                    <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                    <path d="M20 21v-2a4 4 0 0 0-3-3.87M4 21v-2a4 4 0 0 1 3-3.87" />
                    <circle cx="12" cy="7" r="1" />
                    <path d="M12 14v3M12 19v1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="min-h-screen flex items-center justify-center py-20 px-5" style={{ background: "linear-gradient(180deg, rgba(250,250,250,0.8) 0%, rgba(255,224,227,0.95) 100%)" }}>
          <div className={`text-center max-w-2xl mx-auto transition-all duration-1000 ${visibleSections.has("cta") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to get started?</h2>
            <p className="text-xl text-gray-500 mb-12">
              Join thousands of users who trust Espoir AI for their healthcare needs.
            </p>
            <button className="inline-flex items-center gap-3 px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-[#ff4858] to-[#ff6b7a] rounded-full shadow-lg shadow-[#ff4858]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#ff4858]/40">
              Start Searching
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>

        <footer className="py-10 text-center bg-[#1a1a2e] text-white/60 text-sm">
          <p><span className="text-[#ff4858]">Espoir AI</span> — Intelligent Healthcare for Everyone</p>
        </footer>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
