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

async function generateContent({ text, imageBase64, slideCount }) {
  const hasImage = !!imageBase64;
  const prompt = `당신은 노르웨이에서 운영하는 케이뷰티 & 이너뷰티 인스타그램 계정의 콘텐츠 매니저입니다.
${hasImage ? "업로드된 이미지를 분석하고, " : ""}아래 내용을 바탕으로 인스타그램 캐러셀 ${slideCount}장과 캡션을 생성해주세요.

톤앤매너: 미니멀하고 세련됨, 진정성 있는 뷰티 인사이더 느낌, 친근하지만 전문적
계정 언어: 노르웨이어 (주), 영어 해시태그 + 노르웨이어 해시태그 혼합

입력 내용:
${text || "(이미지에서 내용 파악해주세요)"}

아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만:
{
  "topic": "주제 한 줄 (한국어)",
  "slides": [
    {
      "type": "cover",
      "ko_title": "한국어 제목",
      "no_title": "노르웨이어 제목",
      "ko_sub": "한국어 부제",
      "no_sub": "노르웨이어 부제",
      "emoji": "이모지"
    },
    {
      "type": "content",
      "ko_headline": "한국어 헤드라인",
      "no_headline": "노르웨이어 헤드라인",
      "ko_body": "한국어 본문 1-2문장",
      "no_body": "노르웨이어 본문 1-2문장",
      "emoji": "이모지"
    },
    {
      "type": "cta",
      "ko_headline": "한국어 행동유도",
      "no_headline": "노르웨이어 행동유도",
      "ko_action": "한국어 액션",
      "no_action": "노르웨이어 액션",
      "emoji": "이모지"
    }
  ],
  "caption_no": "노르웨이어 캡션 전체 (이모지 포함, 자연스럽고 참여 유도하는 문장, 150-200자)",
  "caption_ko": "한국어 캡션 전체 (내용 파악용, 100-150자)",
  "hashtags_no": "#kbeauty #kskjønnhet #koreanbeauty #hudpleie #koreanskincare #indresskjønnhet #naturligskjønnhet",
  "hashtags_en": "#kbeauty #skincare #innerbeauty #koreanskincare #beautyreview #skincareaddict #glowingskin"
}

슬라이드는 cover 1장, content ${slideCount - 2}장, cta 1장으로 구성하세요.`;

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

  const data = await res.json();
  const raw = data.content.map((b) => b.text || "").join("");
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function SlideCard({ slide, index, total, image, lang }) {
  const isKo = lang === "ko";
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

  const counter = (
    <div style={{ position: "absolute", top: 16, right: 18, fontSize: 10, color: C.sub, letterSpacing: 2, fontFamily: "sans-serif" }}>
      {index + 1} / {total}
    </div>
  );
  const accent = <div style={{ width: 28, height: 1.5, background: C.accent, marginBottom: 18, borderRadius: 2 }} />;

  if (slide.type === "cover") {
    return (
      <div style={base}>
        {image && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.12, borderRadius: 18 }} />}
        {counter}
        <div style={{ fontSize: 32, marginBottom: 14 }}>{slide.emoji}</div>
        {accent}
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, lineHeight: 1.35, marginBottom: 10 }}>
          {isKo ? slide.ko_title : slide.no_title}
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.7, fontStyle: "italic" }}>
          {isKo ? slide.ko_sub : slide.no_sub}
        </div>
        <div style={{ position: "absolute", bottom: 16, fontSize: 10, color: C.beige2, letterSpacing: 3, fontFamily: "sans-serif" }}>← SWIPE →</div>
      </div>
    );
  }

  if (slide.type === "cta") {
    return (
      <div style={base}>
        {counter}
        <div style={{ fontSize: 30, marginBottom: 16 }}>{slide.emoji}</div>
        {accent}
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 10, lineHeight: 1.4 }}>
          {isKo ? slide.ko_headline : slide.no_headline}
        </div>
        <div style={{ fontSize: 12, color: C.accentDark, fontFamily: "sans-serif", letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>
          {isKo ? slide.ko_action : slide.no_action}
        </div>
      </div>
    );
  }

  return (
    <div style={base}>
      {counter}
      <div style={{ fontSize: 28, marginBottom: 14 }}>{slide.emoji}</div>
      {accent}
      <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, marginBottom: 10, lineHeight: 1.4 }}>
        {isKo ? slide.ko_headline : slide.no_headline}
      </div>
      <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.8, fontStyle: "italic" }}>
        {isKo ? slide.ko_body : slide.no_body}
      </div>
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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lang, setLang] = useState("no");
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

  const handleGenerate = async () => {
    if (!text.trim() && !imageBase64) return;
    setLoading(true); setError(""); setResult(null); setCurrentSlide(0);
    try {
      const data = await generateContent({ text, imageBase64, slideCount });
      setResult(data);
    } catch (e) {
      setError("생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
    setLoading(false);
  };

  const slides = result?.slides || [];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Georgia', serif", color: C.text }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.sub, textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: 4 }}>K-Beauty Oslo</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>캐러셀 콘텐츠 자동화</div>
        </div>
        <div style={{ fontSize: 11, color: C.sub, fontFamily: "sans-serif", textAlign: "right", lineHeight: 1.7 }}>한국어 + 노르웨이어<br />캐러셀 & 캡션 생성기</div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: 24 }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, flexWrap: "wrap" }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase" }}>슬라이드 수</div>
            {[3, 5, 7].map((n) => (
              <button key={n} onClick={() => setSlideCount(n)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${slideCount === n ? C.accent : C.border}`, background: slideCount === n ? C.accent : "transparent", color: slideCount === n ? "#fff" : C.sub, fontSize: 12, fontFamily: "sans-serif", cursor: "pointer", fontWeight: slideCount === n ? 700 : 400 }}>{n}장</button>
            ))}
            <button onClick={handleGenerate} disabled={loading || (!text.trim() && !imageBase64)} style={{ marginLeft: "auto", padding: "10px 28px", borderRadius: 24, border: "none", background: loading || (!text.trim() && !imageBase64) ? C.beige2 : C.accent, color: loading || (!text.trim() && !imageBase64) ? C.sub : "#fff", fontSize: 13, fontFamily: "sans-serif", fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 }}>
              {loading ? "⏳ 생성 중..." : "✦ 콘텐츠 생성"}
            </button>
          </div>
        </div>

        {error && <div style={{ color: "#c0625a", fontSize: 13, fontFamily: "sans-serif", textAlign: "center" }}>{error}</div>}

        {result && (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 6 }}>생성된 콘텐츠</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{result.topic}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              {[["no", "🇳🇴 노르웨이어"], ["ko", "🇰🇷 한국어"]].map(([l, label]) => (
                <button key={l} onClick={() => setLang(l)} style={{ padding: "8px 22px", border: `1px solid ${C.border}`, background: lang === l ? C.text : C.surface, color: lang === l ? "#fff" : C.sub, fontSize: 12, fontFamily: "sans-serif", cursor: "pointer", fontWeight: lang === l ? 700 : 400, borderRadius: l === "no" ? "20px 0 0 20px" : "0 20px 20px 0" }}>{label}</button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <button onClick={() => setCurrentSlide((c) => Math.max(0, c - 1))} disabled={currentSlide === 0}
                style={{ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.surface, color: currentSlide === 0 ? C.border : C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>‹</button>
              <div style={{ width: 320, height: 320, background: C.beige, borderRadius: 20, overflow: "hidden", position: "relative", border: `1px solid ${C.border}` }}>
                {slides.map((slide, i) => (
                  <div key={i} style={{ position: "absolute", inset: 0, opacity: i === currentSlide ? 1 : 0, transition: "opacity 0.4s", pointerEvents: i === currentSlide ? "auto" : "none" }}>
                    <SlideCard slide={slide} index={i} total={slides.length} image={imagePreview} lang={lang} />
                  </div>
                ))}
              </div>
              <button onClick={() => setCurrentSlide((c) => Math.min(slides.length - 1, c + 1))} disabled={currentSlide === slides.length - 1}
                style={{ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.surface, color: currentSlide === slides.length - 1 ? C.border : C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>›</button>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 7 }}>
              {slides.map((_, i) => (
                <div key={i} onClick={() => setCurrentSlide(i)} style={{ width: i === currentSlide ? 22 : 7, height: 7, borderRadius: 4, background: i === currentSlide ? C.accent : C.beige2, cursor: "pointer", transition: "all 0.3s" }} />
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {slides.map((slide, i) => (
                <div key={i} onClick={() => setCurrentSlide(i)} style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 12, background: slide.type === "cta" ? C.beige : C.surface, border: `2px solid ${i === currentSlide ? C.accent : C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 20 }}>{slide.emoji}</div>
                  <div style={{ fontSize: 9, color: C.sub, fontFamily: "sans-serif", marginTop: 3 }}>{i + 1}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 14 }}>캡션 & 해시태그</div>
              <CaptionBox label="🇳🇴 노르웨이어 캡션 (게시용)" caption={result.caption_no} hashtags_no={result.hashtags_no} hashtags_en={result.hashtags_en} />
              <CaptionBox label="🇰🇷 한국어 캡션 (내용 파악용)" caption={result.caption_ko} hashtags_no={result.hashtags_no} hashtags_en={result.hashtags_en} />
            </div>

            <div style={{ background: C.beige, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", fontSize: 12, color: C.sub, fontFamily: "sans-serif", lineHeight: 1.8 }}>
              💡 각 슬라이드를 스크린샷 캡처 후 인스타그램에 업로드 → 노르웨이어 캡션 복사 붙여넣기
            </div>
          </>
        )}
      </div>
    </div>
  );
}
