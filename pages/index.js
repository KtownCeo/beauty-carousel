import { useState, useRef, useCallback } from "react";

const C = {
  bg: "#faf8f5",
  surface: "#ffffff",
  beige: "#f0ebe3",
  beige2: "#e8e0d4",
  border: "#e2dbd0",
  text: "#1a1714",
  sub: "#8a8078",
  accent: "#c4a882",
  accentDark: "#9a7d5e",
};

const LANGS = [
  { code: "no", label: "🇳🇴 노르웨이어", name: "노르웨이어" },
  { code: "ko", label: "🇰🇷 한국어", name: "한국어" },
  { code: "en", label: "🇬🇧 영어", name: "영어" },
];

async function generateContent({ text, imageBase64, slideCount, outputLangs }) {
  const hasImage = !!imageBase64;
  const langNames = outputLangs.map(l => LANGS.find(x => x.code === l)?.name).join(", ");

  const prompt = `You are a content manager for a K-Beauty & Inner Beauty Instagram account operated in Norway.
${hasImage ? "Analyze the uploaded image and " : ""}Based on the content below, create an Instagram carousel with ${slideCount} slides and captions.

Tone: Minimal, refined, authentic beauty insider feel, friendly but professional.
Output languages requested: ${langNames}

Input content:
${text || "(Please analyze from the image)"}

IMPORTANT: Respond with ONLY valid JSON. No other text, no markdown code blocks, just pure JSON.

{
  "topic": "One-line topic in Korean",
  "slides": [
    {
      "type": "cover",
      ${outputLangs.includes("ko") ? '"ko_title": "Korean title", "ko_sub": "Korean subtitle",' : ""}
      ${outputLangs.includes("no") ? '"no_title": "Norwegian title", "no_sub": "Norwegian subtitle",' : ""}
      ${outputLangs.includes("en") ? '"en_title": "English title", "en_sub": "English subtitle",' : ""}
      "emoji": "emoji"
    },
    {
      "type": "content",
      ${outputLangs.includes("ko") ? '"ko_headline": "Korean headline", "ko_body": "Korean body 1-2 sentences",' : ""}
      ${outputLangs.includes("no") ? '"no_headline": "Norwegian headline", "no_body": "Norwegian body 1-2 sentences",' : ""}
      ${outputLangs.includes("en") ? '"en_headline": "English headline", "en_body": "English body 1-2 sentences",' : ""}
      "emoji": "emoji"
    },
    {
      "type": "cta",
      ${outputLangs.includes("ko") ? '"ko_headline": "Korean CTA", "ko_action": "Korean action",' : ""}
      ${outputLangs.includes("no") ? '"no_headline": "Norwegian CTA", "no_action": "Norwegian action",' : ""}
      ${outputLangs.includes("en") ? '"en_headline": "English CTA", "en_action": "English action",' : ""}
      "emoji": "emoji"
    }
  ],
  ${outputLangs.includes("ko") ? '"caption_ko": "Korean caption (100-150 chars, with emojis)",' : ""}
  ${outputLangs.includes("no") ? '"caption_no": "Norwegian caption (150-200 chars, with emojis, engaging)",' : ""}
  ${outputLangs.includes("en") ? '"caption_en": "English caption (150-200 chars, with emojis, engaging)",' : ""}
  "hashtags_no": "#kbeauty #kskjønnhet #koreanbeauty #hudpleie #koreanskincare",
  "hashtags_en": "#kbeauty #skincare #innerbeauty #koreanskincare #glowingskin"
}

Make ${slideCount} slides: 1 cover, ${slideCount - 2} content slides, 1 CTA slide.`;

  const userContent = hasImage
    ? [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
        { type: "text", text: prompt },
      ]
    : prompt;

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: userContent }] }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Server error: " + err);
  }

  const data = await res.json();

  if (data.error) throw new Error("API error: " + JSON.stringify(data.error));
  if (!data.content || !data.content.length) throw new Error("Empty response: " + JSON.stringify(data));

  const raw = data.content.map((b) => b.text || "").join("");
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON found in: " + raw.slice(0, 200));

  return JSON.parse(raw.slice(first, last + 1));
}

function SlideCard({ slide, index, total, image, lang }) {
  const base = {
    width: "100%", height: "100%",
    borderRadius: 18,
    background: slide.type === "cta" ? C.beige : C.surface,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "32px 28px", boxSizing: "border-box",
    position: "relative",
    fontFamily: "'Georgia', serif",
    textAlign: "center", overflow: "hidden",
  };

  const getTitle = () => slide[`${lang}_title`] || slide.ko_title || slide.no_title || slide.en_title || "";
  const getSub = () => slide[`${lang}_sub`] || slide.ko_sub || slide.no_sub || slide.en_sub || "";
  const getHeadline = () => slide[`${lang}_headline`] || slide.ko_headline || slide.no_headline || slide.en_headline || "";
  const getBody = () => slide[`${lang}_body`] || slide.ko_body || slide.no_body || slide.en_body || "";
  const getAction = () => slide[`${lang}_action`] || slide.ko_action || slide.no_action || slide.en_action || "";

  const counter = (
    <div style={{ position: "absolute", top: 16, right: 18, fontSize: 10, color: C.sub, letterSpacing: 2, fontFamily: "sans-serif" }}>
      {index + 1} / {total}
    </div>
  );
  const accentLine = <div style={{ width: 28, height: 1.5, background: C.accent, marginBottom: 18, borderRadius: 2 }} />;

  if (slide.type === "cover") {
    return (
      <div style={base}>
        {image && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.12, borderRadius: 18 }} />}
        {counter}
        <div style={{ fontSize: 32, marginBottom: 14 }}>{slide.emoji}</div>
        {accentLine}
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, lineHeight: 1.35, marginBottom: 10 }}>{getTitle()}</div>
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.7, fontStyle: "italic" }}>{getSub()}</div>
        <div style={{ position: "absolute", bottom: 16, fontSize: 10, color: C.beige2, letterSpacing: 3, fontFamily: "sans-serif" }}>← SWIPE →</div>
      </div>
    );
  }

  if (slide.type === "cta") {
    return (
      <div style={base}>
        {counter}
        <div style={{ fontSize: 30, marginBottom: 16 }}>{slide.emoji}</div>
        {accentLine}
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 10, lineHeight: 1.4 }}>{getHeadline()}</div>
        <div style={{ fontSize: 12, color: C.accentDark, fontFamily: "sans-serif", letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>{getAction()}</div>
      </div>
    );
  }

  return (
    <div style={base}>
      {counter}
      <div style={{ fontSize: 28, marginBottom: 14 }}>{slide.emoji}</div>
      {accentLine}
      <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, marginBottom: 10, lineHeight: 1.4 }}>{getHeadline()}</div>
      <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.8, fontStyle: "italic" }}>{getBody()}</div>
    </div>
  );
}

function CaptionBox({ label, caption, hashtags_no, hashtags_en }) {
  const [copied, setCopied] = useState(false);
  const full = `${caption}\n\n${hashtags_no}\n${hashtags_en}`;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.sub, textTransform: "uppercase", fontFamily: "sans-serif" }}>{label}</div>
        <button onClick={() => { navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ fontSize: 11, color: copied ? C.accentDark : C.accent, background: "none", border: "none", cursor: "pointer", fontFamily: "sans-serif", fontWeight: 600 }}>
          {copied ? "✓ 복사됨" : "복사"}
        </button>
      </div>
      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: 10 }}>{caption}</div>
      <div style={{ fontSize: 11.5, color: C.accent, lineHeight: 1.9 }}>{hashtags_no}</div>
      <div style={{ fontSize: 11.5, color: C.accentDark, lineHeight: 1.9 }}>{hashtags_en}</div>
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [slideCount, setSlideCount] = useState(5);
  const [outputLangs, setOutputLangs] = useState(["no", "ko"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previewLang, setPreviewLang] = useState("no");
  const fileRef = useRef();

  const handleImage = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setImageBase64(e.target.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const toggleLang = (code) => {
    setOutputLangs(prev =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter(l => l !== code) : prev
        : [...prev, code]
    );
  };

  const handleGenerate = async () => {
    if (!text.trim() && !imageBase64) return;
    setLoading(true); setError(""); setResult(null); setCurrentSlide(0);
    try {
      const data = await generateContent({ text, imageBase64, slideCount, outputLangs });
      setResult(data);
      setPreviewLang(outputLangs[0]);
    } catch (e) {
      setError("오류: " + e.message);
    }
    setLoading(false);
  };

  const slides = result?.slides || [];
  const availableLangs = LANGS.filter(l => outputLangs.includes(l.code));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Georgia', serif", color: C.text }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.sub, textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: 4 }}>K-Beauty Oslo</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>캐러셀 콘텐츠 자동화</div>
        </div>
        <div style={{ fontSize: 11, color: C.sub, fontFamily: "sans-serif", textAlign: "right", lineHeight: 1.7 }}>케이뷰티 인스타<br />캐러셀 & 캡션 생성기</div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* 입력 패널 */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: "28px 26px" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 18 }}>콘텐츠 입력</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div
              onClick={() => !imagePreview && fileRef.current.click()}
              onDrop={(e) => { e.preventDefault(); handleImage(e.dataTransfer.files[0]); }}
              onDragOver={(e) => e.preventDefault()}
              style={{ width: 160, height: 160, borderRadius: 14, border: `1.5px dashed ${imagePreview ? C.accent : C.border}`, background: C.beige, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", overflow: "hidden", flexShrink: 0 }}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageBase64(null); }}
                    style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer" }}>×</button>
                </>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontSize: 11, color: C.sub, fontFamily: "sans-serif", lineHeight: 1.6 }}>이미지 업로드<br />또는 드래그</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImage(e.target.files[0])} />
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder="소개할 제품, 성분, 효능, 사용법, 후기 등을 자유롭게 입력하세요.&#10;이미지만 있어도 자동 분석됩니다."
              style={{ flex: 1, minWidth: 200, height: 160, background: C.beige, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 13.5, lineHeight: 1.8, padding: "14px 16px", boxSizing: "border-box", resize: "none", fontFamily: "inherit", outline: "none" }} />
          </div>

          {/* 언어 선택 */}
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase" }}>출력 언어</div>
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => toggleLang(l.code)} style={{
                padding: "6px 14px", borderRadius: 20,
                border: `1.5px solid ${outputLangs.includes(l.code) ? C.accent : C.border}`,
                background: outputLangs.includes(l.code) ? C.accent : "transparent",
                color: outputLangs.includes(l.code) ? "#fff" : C.sub,
                fontSize: 12, fontFamily: "sans-serif", cursor: "pointer",
                fontWeight: outputLangs.includes(l.code) ? 700 : 400,
                transition: "all 0.2s",
              }}>{l.label}</button>
            ))}
          </div>

          {/* 슬라이드 수 + 생성 버튼 */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase" }}>슬라이드 수</div>
            {[3, 5, 7].map((n) => (
              <button key={n} onClick={() => setSlideCount(n)} style={{
                padding: "6px 14px", borderRadius: 20,
                border: `1px solid ${slideCount === n ? C.text : C.border}`,
                background: slideCount === n ? C.text : "transparent",
                color: slideCount === n ? "#fff" : C.sub,
                fontSize: 12, fontFamily: "sans-serif", cursor: "pointer",
                fontWeight: slideCount === n ? 700 : 400,
              }}>{n}장</button>
            ))}
            <button onClick={handleGenerate} disabled={loading || (!text.trim() && !imageBase64)} style={{
              marginLeft: "auto", padding: "10px 28px", borderRadius: 24, border: "none",
              background: loading || (!text.trim() && !imageBase64) ? C.beige2 : C.accent,
              color: loading || (!text.trim() && !imageBase64) ? C.sub : "#fff",
              fontSize: 13, fontFamily: "sans-serif", fontWeight: 700, cursor: "pointer", letterSpacing: 0.5,
            }}>
              {loading ? "⏳ 생성 중..." : "✦ 콘텐츠 생성"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ color: "#c0625a", fontSize: 12, fontFamily: "sans-serif", textAlign: "center", background: "#fff0ee", padding: "12px 16px", borderRadius: 10, border: "1px solid #f4c2c2", wordBreak: "break-all" }}>
            {error}
          </div>
        )}

        {result && (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 6 }}>생성된 콘텐츠</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{result.topic}</div>
            </div>

            {/* 언어 토글 (생성된 언어만 표시) */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              {availableLangs.map((l, i) => (
                <button key={l.code} onClick={() => setPreviewLang(l.code)} style={{
                  padding: "8px 20px",
                  border: `1px solid ${C.border}`,
                  background: previewLang === l.code ? C.text : C.surface,
                  color: previewLang === l.code ? "#fff" : C.sub,
                  fontSize: 12, fontFamily: "sans-serif", cursor: "pointer",
                  fontWeight: previewLang === l.code ? 700 : 400,
                  borderRadius: i === 0 ? "20px 0 0 20px" : i === availableLangs.length - 1 ? "0 20px 20px 0" : "0",
                }}>{l.label}</button>
              ))}
            </div>

            {/* 슬라이드 뷰어 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <button onClick={() => setCurrentSlide((c) => Math.max(0, c - 1))} disabled={currentSlide === 0}
                style={{ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.surface, color: currentSlide === 0 ? C.border : C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>‹</button>
              <div style={{ width: 320, height: 320, background: C.beige, borderRadius: 20, overflow: "hidden", position: "relative", border: `1px solid ${C.border}` }}>
                {slides.map((slide, i) => (
                  <div key={i} style={{ position: "absolute", inset: 0, opacity: i === currentSlide ? 1 : 0, transition: "opacity 0.4s", pointerEvents: i === currentSlide ? "auto" : "none" }}>
                    <SlideCard slide={slide} index={i} total={slides.length} image={imagePreview} lang={previewLang} />
                  </div>
                ))}
              </div>
              <button onClick={() => setCurrentSlide((c) => Math.min(slides.length - 1, c + 1))} disabled={currentSlide === slides.length - 1}
                style={{ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.surface, color: currentSlide === slides.length - 1 ? C.border : C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>›</button>
            </div>

            {/* 도트 */}
            <div style={{ display: "flex", justifyContent: "center", gap: 7 }}>
              {slides.map((_, i) => (
                <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: i === currentSlide ? 22 : 7, height: 7, borderRadius: 4, background: i === currentSlide ? C.accent : C.beige2, cursor: "pointer", transition: "all 0.3s" }} />
              ))}
            </div>

            {/* 썸네일 */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {slides.map((slide, i) => (
                <div key={i} onClick={() => setCurrentSlide(i)} style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 12, background: slide.type === "cta" ? C.beige : C.surface, border: `2px solid ${i === currentSlide ? C.accent : C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 20 }}>{slide.emoji}</div>
                  <div style={{ fontSize: 9, color: C.sub, fontFamily: "sans-serif", marginTop: 3 }}>{i + 1}</div>
                </div>
              ))}
            </div>

            {/* 캡션 */}
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 14 }}>캡션 & 해시태그</div>
              {result.caption_no && <CaptionBox label="🇳🇴 노르웨이어 캡션 (게시용)" caption={result.caption_no} hashtags_no={result.hashtags_no} hashtags_en={result.hashtags_en} />}
              {result.caption_en && <CaptionBox label="🇬🇧 영어 캡션" caption={result.caption_en} hashtags_no={result.hashtags_no} hashtags_en={result.hashtags_en} />}
              {result.caption_ko && <CaptionBox label="🇰🇷 한국어 캡션 (내용 파악용)" caption={result.caption_ko} hashtags_no={result.hashtags_no} hashtags_en={result.hashtags_en} />}
            </div>

            <div style={{ background: C.beige, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", fontSize: 12, color: C.sub, fontFamily: "sans-serif", lineHeight: 1.8 }}>
              💡 각 슬라이드를 스크린샷 캡처 후 인스타그램에 업로드 → 캡션 복사 붙여넣기
            </div>
          </>
        )}
      </div>
    </div>
  );
}
