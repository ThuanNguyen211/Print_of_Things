import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import axios from "axios";

export default function UploadPage() {
  const [albumName, setAlbumName] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("album_name", albumName); // tên người dùng nhập
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      alert(`✅ Upload thành công: ${data.album_name}`);
    } catch (err) {
      console.error(err);
      alert("❌ Upload thất bại — không thể kết nối đến server.");
    }
  };


  return (
    <div className="p-8 flex justify-center">
      <Card className="w-[600px] shadow-lg">
        <CardHeader>
          <CardTitle>Tạo bộ ảnh mới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Nhập tên bộ ảnh..."
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
          />
          <Input type="file" multiple accept="image/*" onChange={handleFileChange} />
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, idx) => (
              <img key={idx} src={src} alt="preview" className="w-full h-24 object-cover rounded-lg" />
            ))}
          </div>
          <Button className="w-full" onClick={handleUpload}>Tải lên</Button>
        </CardContent>
      </Card>
    </div>
  );
}
