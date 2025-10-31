import React, { useEffect, useState, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Viewer3D from "@/components/Viewer3D"; // Đảm bảo Viewer3D đã dùng GLTFLoader

// --- Các Component Dự Phòng (Fallback) ---

/**
 * 🎨 Component này sẽ hiển thị khi `Viewer3D` (hoặc GLTFLoader) GẶP LỖI.
 */
function ModelErrorFallback({ error }) {
  return (
    <Alert variant="destructive">
      <AlertDescription className="space-y-2">
        <h5 className="font-bold">❌ Không thể tải mô hình 3D</h5>
        <p className="text-sm">
          Đã xảy ra lỗi khi tải mô hình. Nếu bạn đang tải demo, hãy kiểm tra
          đường dẫn tệp trong thư mục `public`. Nếu bạn đang xử lý, có thể
          backend đã gặp lỗi.
        </p>
        <pre className="text-xs bg-gray-800 text-white p-2 rounded">
          {error.message}
        </pre>
      </AlertDescription>
    </Alert>
  );
}

/**
 * ⏳ Component này sẽ hiển thị khi mô hình 3D đang được tải.
 */
function ModelLoadingFallback() {
  return (
    <div className="flex justify-center items-center h-[200px] text-gray-500">
      <p>Đang tải mô hình 3D...</p>
    </div>
  );
}

// --- Component Trang Chính ---

export default function ModelPage() {
  const [sets, setSets] = useState([]);
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState(null);
  const [modelUrl, setModelUrl] = useState(null); // Tên chung cho URL mô hình
  const [loading, setLoading] = useState(false);

  // --- Logic cho Backend (Lấy danh sách) ---
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/v1/list")
      .then((res) => res.json())
      .then((data) => setSets(data.sets || []))
      .catch(() => setSets([]));
  }, []);

  // --- Logic cho Backend (Xử lý) ---
  const handleProcess = async () => {
    if (!selected) {
      alert("Vui lòng chọn bộ ảnh để xử lý!");
      return;
    }
    setLoading(true);
    setStatus("queued");
    setModelUrl(null); // Ẩn mô hình cũ

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/process/${selected}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Không thể bắt đầu xử lý");
      setStatus("processing");

      // Poll trạng thái
      const interval = setInterval(async () => {
        try {
          const check = await fetch(
            `http://127.0.0.1:8000/api/v1/status/${selected}`
          );
          const json = await check.json();

          if (json.status === "done") {
            clearInterval(interval);
            setStatus("done");
            // API backend của bạn phải trả về tệp .glb
            setModelUrl(`http://127.0.0.1:8000/api/v1/download/${selected}`);
            setLoading(false);
          } else if (json.status === "error") {
            clearInterval(interval);
            setStatus("error");
            setLoading(false);
          } else {
            setStatus(json.status);
          }
        } catch (pollErr) {
          clearInterval(interval);
          setStatus("error");
          setLoading(false);
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setLoading(false);
    }
  };

  // --- Logic cho Demo (Tải tệp .glb từ /public) ---
  const handleLoadDemo = () => {
    // Đặt lại các trạng thái xử lý backend
    setStatus(null);
    setLoading(false);

    // Đặt URL trực tiếp vào tệp .glb trong thư mục /public
    setModelUrl("/models/demo_model.glb");
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6">
      {/* Card 1: Xử lý từ Backend */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-center font-bold text-blue-600">
            Xây dựng mô hình 3D
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block text-sm font-medium">Chọn bộ ảnh:</label>
          <Select onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn một bộ ảnh..." />
            </SelectTrigger>
            <SelectContent>
              {sets.map((item) => (
                <SelectItem key={item.session_id} value={item.session_id}>
                  {item.album_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="w-full mt-4"
            onClick={handleProcess}
            disabled={loading}
          >
            {loading ? "⏳ Đang xử lý..." : "🚀 Bắt đầu xử lý"}
          </Button>
        </CardContent>
      </Card>

      {/* Card 2: Tải Demo từ máy */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-center font-bold text-green-600">
            Tải Demo (Tệp .glb có sẵn)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleLoadDemo}>
            Tải mô hình demo (.glb)
          </Button>
        </CardContent>
      </Card>

      {/* Hiển thị trạng thái (chỉ khi xử lý backend) */}
      {status && (
        <Alert className="mt-4">
          <AlertDescription>
            {status === "queued" && "🕒 Đang đưa vào hàng đợi..."}
            {status === "processing" && "⚙️ Hệ thống đang xử lý mô hình..."}
            {status === "done" && "✅ Hoàn tất! Mô hình đã sẵn sàng."}
            {status === "error" && "❌ Xảy ra lỗi trong quá trình xử lý."}
          </AlertDescription>
        </Alert>
      )}

      {/* Hiển thị mô hình 3D (Dùng chung cho cả 2 cách) */}
      {modelUrl && (
        <Card className="mt-6 p-4 shadow-lg">
          <CardTitle className="text-lg mb-2 font-semibold text-gray-700">
            Xem mô hình 3D
          </CardTitle>

          <ErrorBoundary
            FallbackComponent={ModelErrorFallback}
            resetKeys={[modelUrl]}
          >
            <Suspense fallback={<ModelLoadingFallback />}>
              <Viewer3D stlUrl={modelUrl} />
            </Suspense>
          </ErrorBoundary>
        </Card>
      )}
    </div>
  );
}