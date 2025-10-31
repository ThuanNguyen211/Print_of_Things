// src/components/Viewer3D.jsx

import React, { Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
// 1. ❗️ Import GLTFLoader
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// *THREE không cần import nữa nếu chỉ dùng loader*

/**
 * Component con để tải mô hình GLB.
 * GLTFLoader trả về một đối tượng chứa thuộc tính 'scene'.
 */
function GLBModel({ url }) {
  // 2. ❗️ Sử dụng GLTFLoader
  const gltf = useLoader(GLTFLoader, url);

  // 3. ❗️ Dùng <primitive /> để render toàn bộ scene
  // .glb đã bao gồm vật liệu (materials) riêng,
  // vì vậy chúng ta không cần tạo <meshStandardMaterial> nữa.
  return (
    <primitive
      object={gltf.scene}
      rotation={[-Math.PI / 2, 0, 0]} // Giữ lại rotation nếu bạn cần
      scale={1} // Thêm scale nếu mô hình quá lớn/nhỏ
    />
  );
}

// Prop 'stlUrl' được giữ nguyên tên để khớp với ModelPage.jsx
// Mặc dù bây giờ nó thực sự là 'modelUrl'
export default function Viewer3D({ stlUrl }) {
  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-xl shadow-inner">
      <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
        {/* Ánh sáng có thể không cần thiết nếu tệp .glb
            đã có ánh sáng (hoặc dùng Environment) */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        
        <Suspense fallback={null}>
          {/* 4. ❗️ Gọi component mới */}
          <GLBModel url={stlUrl} />
        </Suspense>
        
        <OrbitControls />
        <Environment preset="sunset" background={false} />
      </Canvas>
    </div>
  );
}