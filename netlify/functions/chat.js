exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing DEEPSEEK_API_KEY in Netlify environment variables." })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON body." })
    };
  }

  const patientText = `
姓名：${data.name || "未提供"}
年龄：${data.age || "未提供"}
性别：${data.gender || "未提供"}
主诉：${data.complaint || "未提供"}
持续时间：${data.duration || "未提供"}
伴随症状：${data.symptoms || "未提供"}
既往史/用药/过敏：${data.history || "未提供"}
舌象描述：${data.tongue || "未提供"}
`.trim();

  const systemPrompt = `
你是中医线上问诊前资料整理助手。你的任务是帮助中医师整理患者资料，而不是替代医生诊断。
必须遵守：
1. 不作确诊。
2. 不承诺疗效。
3. 不直接开处方。
4. 遇到危险信号必须建议立即线下就医。
5. 用中文输出，结构清晰，适合中医师快速查看。
6. 输出包括：资料摘要、可能需要追问的问题、中医辨证线索、红旗风险、就诊建议、给患者看的温和说明。
`.trim();

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: patientText }
        ],
        temperature: 0.3,
        max_tokens: 1800
      })
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: json.error?.message || "DeepSeek API error", raw: json })
      };
    }

    const answer = json.choices?.[0]?.message?.content || "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "Server error" })
    };
  }
};
