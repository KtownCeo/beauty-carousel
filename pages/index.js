import { useState, useRef, useCallback } from "react";

const C = {
  bg: "#f5f1eb",
  surface: "#ffffff",
  beige: "#ede8df",
  border: "#ddd6c8",
  text: "#1a1510",
  sub: "#7a7168",
  gold: "#b8906a",
  goldLight: "#d4b490",
  goldDark: "#8a6840",
};

const LANGS = [
  { code: "no", label: "🇳🇴 Norsk" },
  { code: "ko", label: "🇰🇷 한국어" },
  { code: "en", label: "🇬🇧 English" },
];

async function generateSlides({ text, slideCount, outputLangs, firstImage }) {
  const langNames = outputLangs.join(", ");
  const prompt = `You are a luxury K-beauty content director for K-TOWN Oslo Instagram.
Create ${slideCount} carousel slides in the style of high-end Korean beauty brands like Gyeol Haus.
Output languages: ${langNames}
Input: ${text || "Analyze from image"}

Return ONLY valid JSON, no markdown:
{
  "topic": "short topic in Korean",
  "slides": [
    {
      "type": "cover",
      "tag": "K-beauty No.1",
      "no_subtitle": "italic Norwegian subtitle", "no_title": "BOLD TITLE",
      "ko_subtitle": "italic Korean subtitle", "ko_title": "한국어 제목",
      "en_subtitle": "italic English subtitle", "en_title": "BOLD TITLE",
      "overlay": "dark"
    },
    {
      "type": "stats",
      "no_headline": "Norwegian headline", "no_sub": "subtext",
      "ko_headline": "한국어 헤드라인", "ko_sub": "서브텍스트",
      "en_headline": "English headline", "en_sub": "subtext",
      "stats": [
        {"value": "124%", "label_no": "hudbarriere forbedret", "label_ko": "피부장벽 개선", "label_en": "skin barrier improved"},
        {"value": "278%", "label_no": "irritasjon redusert", "label_ko": "자극 감소", "label_en": "irritation reduced"}
      ],
      "checkmarks": ["ECOCERT-sertifisert organisk olje", "Lett tekstur · Ingen klebrighet"],
      "tags": ["Barrier repair", "Ultra moisturizing", "Skin glow up"]
    },
    {
      "type": "content",
      "no_headline": "Norwegian headline", "no_body": "Norwegian body 1-2 sentences.",
      "ko_headline": "한국어 헤드라인", "ko_body": "한국어 본문 1-2문장.",
      "en_headline": "English headline", "en_body": "English body 1-2 sentences.",
      "overlay": "dark"
    },
    {
      "type": "cta",
      "no_headline": "Norwegian CTA", "no_action": "FINN DEN HOS OSS",
      "ko_headline": "한국어 CTA", "ko_action": "지금 확인하기",
      "en_headline": "English CTA", "en_action": "SHOP NOW",
      "badge1": "Hwahae No. 1 · 2025", "badge2": "Best seller K-beauty"
    }
  ],
  "caption_no": "Norwegian caption with emojis 150-200 chars",
  "caption_ko": "Korean caption 100-150 chars",
  "caption_en": "English caption with emojis 150-200 chars",
  "hashtags_no": "#kbeauty #kskjønnhet #koreanbeauty #hudpleie #koreanskincare",
  "hashtags_en": "#kbeauty #skincare #koreanskincare #glowingskin #beautyreview"
}
Make exactly ${slideCount} slides mixing these types.`;

  const userContent = firstImage
    ? [
        { type: "image", source: { type: "base64", media_type: firstImage.mimeType, data: firstImage.base64 } },
        { type: "text", text: prompt },
      ]
    : prompt;

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: userContent }] }),
  });
  if (!res.ok) throw new Error("Server: " + await res.text());
  const data = await res.json();
  if (data.error) throw new Error("API: " + JSON.stringify(data.error));
  if (!data.content?.length) throw new Error("Empty: " + JSON.stringify(data));
  const raw = data.content.map(b => b.text || "").join("");
  const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
  if (s === -1) throw new Error("No JSON found");
  return JSON.parse(raw.slice(s, e + 1));
}

function SlidePreview({ slide, image, brandLogo, ktownLogo, lang, idx, total }) {
  const get = (key) => slide[`${lang}_${key}`] || slide[`no_${key}`] || slide[`ko_${key}`] || slide[`en_${key}`] || "";
  const isDark = slide.overlay === "dark" && image;

  return (
    <div style={{ width: "100%", paddingTop: "123.46%", position: "relative", borderRadius: 14, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: image ? `url(${image}) center/cover` : "#ede8df",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}>
        {isDark && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,.3) 0%,rgba(0,0,0,.6) 100%)" }} />}
        {!isDark && image && <div style={{ position: "absolute", inset: 0, background: "rgba(245,241,235,.87)" }} />}

        {/* 브랜드 로고 상단 좌측 */}
        <div style={{ position: "absolute", top: "5%", left: "6%", zIndex: 10 }}>
          {brandLogo
            ? <img src={brandLogo} alt="" style={{ height: 28, objectFit: "contain", filter: isDark ? "brightness(10)" : "none" }} />
            : null}
        </div>

        {/* 슬라이드 번호 */}
        <div style={{ position: "absolute", top: "5%", right: "6%", fontSize: 10, color: isDark ? "rgba(255,255,255,.55)" : C.sub, letterSpacing: 2, zIndex: 10, fontFamily: "sans-serif" }}>
          {idx + 1} / {total}
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "20% 8% 22%", zIndex: 5 }}>

          {slide.type === "cover" && (
            <>
              {slide.tag && (
                <div style={{ display: "inline-block", border: `1px solid ${isDark ? "rgba(255,255,255,.45)" : C.gold}`, borderRadius: 100, padding: "4px 14px", fontSize: 10, color: isDark ? "rgba(255,255,255,.8)" : C.gold, letterSpacing: 2, marginBottom: 18, fontFamily: "sans-serif", alignSelf: "flex-start" }}>
                  {slide.tag}
                </div>
              )}
              <div style={{ fontSize: 12, color: isDark ? C.goldLight : C.gold, fontStyle: "italic", marginBottom: 8 }}>{get("subtitle")}</div>
              <div style={{ fontSize: "clamp(28px,7vw,48px)", fontWeight: 900, color: isDark ? "#fff" : C.text, lineHeight: 1.05, letterSpacing: -1, marginBottom: 18 }}>{get("title")}</div>
              <div style={{ width: 36, height: 2, background: C.gold }} />
            </>
          )}

          {slide.type === "stats" && (
            <>
              <div style={{ fontSize: 11, color: C.gold, fontStyle: "italic", marginBottom: 6, fontFamily: "sans-serif" }}>{get("sub")}</div>
              <div style={{ fontSize: "clamp(18px,4vw,26px)", fontWeight: 800, color: C.text, marginBottom: 8, lineHeight: 1.2 }}>{get("headline")}</div>
              <div style={{ width: 28, height: 1.5, background: C.gold, marginBottom: 18 }} />
              {slide.stats?.slice(0, 3).map((s, i) => (
                <div key={i} style={{ marginBottom: 6, display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 800, color: C.gold, lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontSize: 11, color: C.sub, fontFamily: "sans-serif" }}>{s[`label_${lang}`] || s.label_no}</span>
                </div>
              ))}
              {slide.checkmarks?.length > 0 && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 3 }}>
                  {slide.checkmarks.map((c, i) => (
                    <div key={i} style={{ fontSize: 10, color: C.sub, fontFamily: "sans-serif" }}>✓ &nbsp;{c}</div>
                  ))}
                </div>
              )}
              {slide.tags?.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {slide.tags.map((t, i) => (
                    <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 100, padding: "2px 10px", fontSize: 9, color: C.sub, fontFamily: "sans-serif" }}>{t}</div>
                  ))}
                </div>
              )}
            </>
          )}

          {slide.type === "content" && (
            <>
              <div style={{ fontSize: "clamp(16px,3.5vw,24px)", fontWeight: 800, color: isDark ? "#fff" : C.text, lineHeight: 1.25, marginBottom: 10 }}>{get("headline")}</div>
              <div style={{ width: 28, height: 1.5, background: C.gold, marginBottom: 14 }} />
              <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,.82)" : C.sub, lineHeight: 1.85, fontStyle: "italic" }}>{get("body")}</div>
            </>
          )}

          {slide.type === "cta" && (
            <>
              <div style={{ fontSize: "clamp(18px,4vw,28px)", fontWeight: 800, color: C.text, lineHeight: 1.25, marginBottom: 8 }}>{get("headline")}</div>
              <div style={{ width: 28, height: 1.5, background: C.gold, marginBottom: 14 }} />
              <div style={{ fontSize: 10, color: C.goldDark, fontFamily: "sans-serif", letterSpacing: 2.5, fontWeight: 700, textTransform: "uppercase", marginBottom: 20 }}>{get("action")}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[slide.badge1, slide.badge2].filter(Boolean).map((b, i) => (
                  <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 10, color: C.sub, fontFamily: "sans-serif" }}>{i === 0 ? "⭐" : "🌟"} {b}</div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* K·TOWN 로고 하단 */}
        <div style={{ position: "absolute", bottom: "4%", left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
          {ktownLogo
            ? <img src={ktownLogo} alt="ktown" style={{ height: 18, objectFit: "contain", filter: isDark ? "brightness(10) opacity(.6)" : "opacity(.4)" }} />
            : <div style={{ fontSize: 11, letterSpacing: 5, color: isDark ? "rgba(255,255,255,.4)" : C.sub, fontFamily: "sans-serif", fontWeight: 300, whiteSpace: "nowrap" }}>K · T O W N</div>
          }
        </div>

        {idx < total - 1 && (
          <div style={{ position: "absolute", bottom: "4%", right: "5%", color: isDark ? "rgba(255,255,255,.3)" : C.border, fontSize: 16, zIndex: 10 }}>→</div>
        )}
      </div>
    </div>
  );
}

function CaptionBox({ label, caption, hashtags_no, hashtags_en }) {
  const [copied, setCopied] = useState(false);
  const full = `${caption}\n\n${hashtags_no}\n${hashtags_en}`;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 9, color: C.sub, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif" }}>{label}</span>
        <button onClick={() => { navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ fontSize: 11, color: copied ? C.goldDark : C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "sans-serif", fontWeight: 600 }}>
          {copied ? "✓ 복사됨" : "복사"}
        </button>
      </div>
      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: 8 }}>{caption}</div>
      <div style={{ fontSize: 11, color: C.gold, lineHeight: 1.9 }}>{hashtags_no}</div>
      <div style={{ fontSize: 11, color: C.goldDark, lineHeight: 1.9 }}>{hashtags_en}</div>
    </div>
  );
}

function ImgCell({ label, img, onUp, onRm, w = 80, h = 100 }) {
  const ref = useRef();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div onClick={() => !img && ref.current.click()}
        onDrop={(e) => { e.preventDefault(); onUp(e.dataTransfer.files[0]); }}
        onDragOver={(e) => e.preventDefault()}
        style={{ width: w, height: h, borderRadius: 10, border: `1.5px dashed ${img ? C.gold : C.border}`, background: img ? "transparent" : C.beige, display: "flex", alignItems: "center", justifyContent: "center", cursor: img ? "default" : "pointer", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        {img
          ? <>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={(e) => { e.stopPropagation(); onRm(); }}
                style={{ position: "absolute", top: 3, right: 3, width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </>
          : <div style={{ textAlign: "center", fontSize: 9, color: C.sub, fontFamily: "sans-serif", lineHeight: 1.6 }}>🖼️<br />업로드</div>
        }
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onUp(e.target.files[0])} />
      </div>
      <div style={{ fontSize: 9, color: C.sub, fontFamily: "sans-serif", textAlign: "center", maxWidth: w }}>{label}</div>
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [slideCount, setSlideCount] = useState(5);
  const [outputLangs, setOutputLangs] = useState(["no", "ko"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(0);
  const [previewLang, setPreviewLang] = useState("no");
  const [slideImages, setSlideImages] = useState(Array(7).fill(null));
  const [brandLogo, setBrandLogo] = useState(null);
  const [ktownLogo, setKtownLogo] = useState(null);

  const loadImg = useCallback((file, cb) => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = (e) => cb(e.target.result, file.type);
    r.readAsDataURL(file);
  }, []);

  const toggleLang = (code) => setOutputLangs(prev =>
    prev.includes(code) ? prev.length > 1 ? prev.filter(l => l !== code) : prev : [...prev, code]
  );

  const handleGenerate = async () => {
    if (!text.trim() && !slideImages.some(Boolean)) return;
    setLoading(true); setError(""); setResult(null); setCurrent(0);
    try {
      const first = slideImages.find(Boolean);
      const firstImage = first ? {
        base64: first.split(",")[1],
        mimeType: first.startsWith("data:image/png") ? "image/png" : first.startsWith("data:image/webp") ? "image/webp" : "image/jpeg"
      } : null;
      const data = await generateSlides({ text, slideCount, outputLangs, firstImage });
      setResult(data);
      setPreviewLang(outputLangs[0]);
    } catch (e) { setError("오류: " + e.message); }
    setLoading(false);
  };

  const slides = result?.slides || [];
  const activeLangs = LANGS.filter(l => outputLangs.includes(l.code));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Georgia', serif", color: C.text }}>
      {/* 헤더 */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 4, color: C.sub, textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: 2 }}>K·TOWN Oslo</div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>캐러셀 콘텐츠 스튜디오</div>
        </div>
        <div style={{ fontSize: 10, color: C.sub, fontFamily: "sans-serif", textAlign: "right", lineHeight: 1.7 }}>1080 × 1350<br />Instagram</div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* 입력 패널 */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: "22px 20px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 14 }}>콘텐츠 입력</div>

          {/* 로고 + 텍스트 */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 9, color: C.sub, fontFamily: "sans-serif", letterSpacing: 1 }}>로고 설정</div>
              <div style={{ display: "flex", gap: 10 }}>
                <ImgCell label="브랜드 로고" img={brandLogo} w={64} h={64}
                  onUp={(f) => loadImg(f, (url) => setBrandLogo(url))}
                  onRm={() => setBrandLogo(null)} />
                <ImgCell label="K·TOWN 로고" img={ktownLogo} w={64} h={64}
                  onUp={(f) => loadImg(f, (url) => setKtownLogo(url))}
                  onRm={() => setKtownLogo(null)} />
              </div>
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder="제품명, 성분, 효능, 수치, 어워드 수상 등을 입력하세요.&#10;이미지로도 자동 분석됩니다."
              style={{ flex: 1, minWidth: 200, height: 110, background: C.beige, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 13, lineHeight: 1.8, padding: "12px 14px", boxSizing: "border-box", resize: "none", fontFamily: "inherit", outline: "none" }} />
          </div>

          {/* 슬라이드별 이미지 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: C.sub, fontFamily: "sans-serif", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>슬라이드별 이미지</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {Array(slideCount).fill(0).map((_, i) => (
                <ImgCell key={i} label={`슬라이드 ${i + 1}`} img={slideImages[i]} w={72} h={90}
                  onUp={(f) => loadImg(f, (url) => setSlideImages(p => { const n = [...p]; n[i] = url; return n; }))}
                  onRm={() => setSlideImages(p => { const n = [...p]; n[i] = null; return n; })} />
              ))}
            </div>
          </div>

          {/* 언어 + 슬라이드 수 + 생성 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase" }}>언어</div>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => toggleLang(l.code)} style={{ padding: "4px 12px", borderRadius: 20, border: `1.5px solid ${outputLangs.includes(l.code) ? C.gold : C.border}`, background: outputLangs.includes(l.code) ? C.gold : "transparent", color: outputLangs.includes(l.code) ? "#fff" : C.sub, fontSize: 11, fontFamily: "sans-serif", cursor: "pointer", fontWeight: outputLangs.includes(l.code) ? 700 : 400 }}>{l.label}</button>
            ))}
            <div style={{ width: 1, height: 20, background: C.border, margin: "0 4px" }} />
            <div style={{ fontSize: 9, letterSpacing: 2, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase" }}>슬라이드</div>
            {[3, 5, 7].map(n => (
              <button key={n} onClick={() => setSlideCount(n)} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${slideCount === n ? C.text : C.border}`, background: slideCount === n ? C.text : "transparent", color: slideCount === n ? "#fff" : C.sub, fontSize: 11, fontFamily: "sans-serif", cursor: "pointer", fontWeight: slideCount === n ? 700 : 400 }}>{n}장</button>
            ))}
            <button onClick={handleGenerate} disabled={loading || (!text.trim() && !slideImages.some(Boolean))} style={{ marginLeft: "auto", padding: "9px 24px", borderRadius: 24, border: "none", background: loading || (!text.trim() && !slideImages.some(Boolean)) ? C.border : C.gold, color: "#fff", fontSize: 12, fontFamily: "sans-serif", fontWeight: 700, cursor: "pointer" }}>
              {loading ? "⏳ 생성 중..." : "✦ 생성"}
            </button>
          </div>
        </div>

        {error && <div style={{ color: "#c0625a", fontSize: 12, fontFamily: "sans-serif", background: "#fff0ee", padding: "12px 16px", borderRadius: 10, border: "1px solid #f4c2c2", wordBreak: "break-all" }}>{error}</div>}

        {result && (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 5 }}>생성 완료</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{result.topic}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              {activeLangs.map((l, i) => (
                <button key={l.code} onClick={() => setPreviewLang(l.code)} style={{ padding: "6px 18px", border: `1px solid ${C.border}`, background: previewLang === l.code ? C.text : C.surface, color: previewLang === l.code ? "#fff" : C.sub, fontSize: 11, fontFamily: "sans-serif", cursor: "pointer", fontWeight: previewLang === l.code ? 700 : 400, borderRadius: i === 0 ? "20px 0 0 20px" : i === activeLangs.length - 1 ? "0 20px 20px 0" : "0" }}>{l.label}</button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.surface, color: current === 0 ? C.border : C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>‹</button>
              <div style={{ width: "min(320px, 75vw)" }}>
                {slides[current] && <SlidePreview slide={slides[current]} image={slideImages[current]} brandLogo={brandLogo} ktownLogo={ktownLogo} lang={previewLang} idx={current} total={slides.length} />}
              </div>
              <button onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))} disabled={current === slides.length - 1}
                style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.surface, color: current === slides.length - 1 ? C.border : C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>›</button>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
              {slides.map((_, i) => (
                <div key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 3, background: i === current ? C.gold : C.border, cursor: "pointer", transition: "all 0.3s" }} />
              ))}
            </div>

            <div style={{ background: C.beige, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", fontSize: 12, color: C.sub, fontFamily: "sans-serif", lineHeight: 1.8 }}>
              💡 슬라이드에서 우클릭 → "이미지로 저장" 으로 다운로드하세요.
            </div>

            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, color: C.sub, fontFamily: "sans-serif", textTransform: "uppercase", marginBottom: 12 }}>캡션 & 해시태그</div>
              {result.caption_no && <CaptionBox label="🇳🇴 Norsk (게시용)" caption={result.caption_no} hashtags_no={result.hashtags_no} hashtags_en={result.hashtags_en} />}
              {result.caption_en && <CaptionBox label="🇬🇧 English" caption={result.caption_en} hashtags_no={result.hashtags_no} hashtags_en={result.hashtags_en} />}
              {result.caption_ko && <CaptionBox label="🇰🇷 한국어 (참고용)" caption={result.caption_ko} hashtags_no={result.hashtags_no} hashtags_en={result.hashtags_en} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
