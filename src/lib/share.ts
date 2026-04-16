import { FeedbackResult } from "./types";

interface ShareData {
  scenarioTitle: string;
  npdName: string;
  feedback: FeedbackResult;
  npdHP: number;
  duration: number;
}

export async function generateShareImage(data: ShareData): Promise<Blob> {
  const W = 600;
  const H = 900;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0f0f23");
  grad.addColorStop(1, "#1a1a3e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // accent strip
  ctx.fillStyle = "#6366f1";
  ctx.fillRect(0, 0, W, 6);

  // title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("NPD 应对训练报告", W / 2, 60);

  // scenario info
  ctx.fillStyle = "#a5b4fc";
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillText(`场景：${data.scenarioTitle}`, W / 2, 100);

  // score circle
  const cx = W / 2;
  const cy = 200;
  const r = 60;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#1e1e3f";
  ctx.fill();
  ctx.strokeStyle = getScoreColor(data.feedback.overallScore);
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(data.feedback.overallScore), cx, cy + 14);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText("/10", cx + 28, cy + 14);

  // sub scores
  const metrics = [
    { label: "边界设定", value: data.feedback.boundaryScore },
    { label: "情绪调节", value: data.feedback.emotionalRegulation },
    { label: "策略运用", value: data.feedback.strategyEffectiveness },
  ];
  const barY = 300;
  metrics.forEach((m, i) => {
    const y = barY + i * 50;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(m.label, 60, y);

    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText(`${m.value}/10`, W - 60, y);

    // bar bg
    const bx = 60;
    const bw = W - 120;
    const bh = 8;
    const by = y + 8;
    ctx.fillStyle = "#2a2a4a";
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fill();

    // bar fill
    ctx.fillStyle = getScoreColor(m.value);
    roundRect(ctx, bx, by, bw * (m.value / 10), bh, 4);
    ctx.fill();
  });

  // NPD HP
  const hpY = 490;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${data.npdName}的心理防线`, 60, hpY);
  ctx.textAlign = "right";
  ctx.fillStyle = getHPColor(data.npdHP);
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillText(`${data.npdHP}%`, W - 60, hpY);

  // bar
  const hpBarY = hpY + 10;
  ctx.fillStyle = "#2a2a4a";
  roundRect(ctx, 60, hpBarY, W - 120, 10, 5);
  ctx.fill();
  ctx.fillStyle = getHPColor(data.npdHP);
  roundRect(ctx, 60, hpBarY, (W - 120) * (data.npdHP / 100), 10, 5);
  ctx.fill();

  // strengths
  const sY = 560;
  ctx.fillStyle = "#a5b4fc";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("做得好的地方", 60, sY);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "13px system-ui, sans-serif";
  data.feedback.strengths.slice(0, 3).forEach((s, i) => {
    const text = `✓ ${s}`;
    const lines = wrapText(ctx, text, W - 140);
    lines.forEach((line, li) => {
      ctx.fillText(line, 60, sY + 24 + (i * 40) + (li * 18));
    });
  });

  // duration
  const dY = H - 100;
  ctx.fillStyle = "#64748b";
  ctx.font = "13px system-ui, sans-serif";
  ctx.textAlign = "center";
  const mins = Math.floor(data.duration / 60);
  const secs = data.duration % 60;
  ctx.fillText(`训练时长：${mins}分${secs}秒`, W / 2, dY);

  // watermark
  ctx.fillStyle = "#4a5568";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("NPD 应对教练 · AI 心理自助训练工具", W / 2, H - 40);
  ctx.fillText("长按识别或搜索体验", W / 2, H - 20);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

function getScoreColor(score: number): string {
  if (score >= 7) return "#22c55e";
  if (score >= 4) return "#eab308";
  return "#ef4444";
}

function getHPColor(hp: number): string {
  if (hp > 70) return "#ef4444";
  if (hp > 30) return "#eab308";
  return "#22c55e";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const char of text) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function shareOrDownload(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "NPD 应对训练结果",
        text: "看看我的 NPD 应对训练成绩！",
      });
      return;
    } catch {
      // fallback to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyLink(scenarioId: string, difficulty: string) {
  const url = `${window.location.origin}/chat?mode=simulation&scenario=${scenarioId}&difficulty=${difficulty}`;
  navigator.clipboard.writeText(url).catch(() => {
    const input = document.createElement("input");
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  });
  return url;
}
