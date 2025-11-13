import { useRef, useState } from "react";

type AvatarPanelProps = {
  avatarUrl?: string | null;
  t: (key: any) => string;
};

export function AvatarPanel({ avatarUrl, t }: AvatarPanelProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="card avatar-panel">
      <header className="panel-header">
        <h2>{t("avatarUpload")}</h2>
      </header>
      <div className="avatar-preview">
        <div className="frame">
          {preview ? <img src={preview} alt="avatar preview" /> : <span>?</span>}
        </div>
        <p className="muted">
          32px / 64px 推薦，尚未串接實際上傳，僅提供預覽。
        </p>
        <button
          className="btn btn-outline"
          onClick={() => fileRef.current?.click()}
        >
          選擇圖片
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg"
          hidden
          onChange={handleFileChange}
        />
      </div>
    </section>
  );
}

