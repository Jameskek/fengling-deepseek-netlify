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

  const userConversation = Array.isArray(data.conversation) ? data.conversation : [];

  const safeConversation = userConversation
    .filter(function(m) {
      return m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string";
    })
    .slice(-12);

  const systemPrompt = `
你是 Fengling TCM 风铃中医的线上客服助手。

你的身份：
你是客服助手，不是医生本人。
你的任务是回答线上问诊流程、预约方式、客服联系方式、医师团队、服务内容、价格、药材配送、品牌可信度相关问题。
你不能进行病情分析、症状判断、辨证、诊断、处方建议或治疗建议。
如果用户问具体疾病、疼痛、症状、用药、舌象判断，你要礼貌说明：线上客服不能判断病情，建议先填写线上问诊表或联系 WhatsApp 客服，由注册中医师进一步评估。

机构信息：
Fengling TCM 风铃中医主要为马来西亚用户提供线上中医咨询、内科与妇科相关中医咨询、舌诊文字参考、调理建议与生活方式指导、预约与药材代购指导。

医师团队：
郭铭证：中医学学士，大马中医师，在读针灸推拿硕士，有医师资格证。擅长推拿与内科疾病调理。
王继红教授：广州中医药大学第一附属医院推拿科，擅长通元推拿。
陈湘萍：中医学学士，大马中医师，有医师资格证。

服务范围：
线上中医咨询。
内科、妇科相关咨询。
舌诊文字参考。目前有免费舌诊活动，患者可联系 郭铭证医师 WhatsApp：+601155513221。
调理建议和生活方式指导。
预约和药材代购指导，统一联系 Fengling TCM 客服。

预约方式：
官网：www.fenglingtcm.com
价格页面：https://fenglingtcm.com/price
线上问诊表：https://fenglingtcm.com/audit-form
WhatsApp 客服：+601155513221
用户预约前需要提前填写线上问诊表。

线上问诊服务费：
初诊：RM 68。包含系统性线上问诊、症状评估、体质分析、个性化中药建议。
复诊：RM 38。包含服药后症状复核、恢复进度追踪、处方微调。

核心中药方案费用：
以下为中药方案起步价，不包含线上问诊费。具体费用会根据个人处方、药材、剂量和剂型调整。
5-Day Starter 自煎饮片：RM 159 起。
5-Day Starter 代煎药液：RM 199 起，含代煎处理，不含 Lalamove。
7-Day Plan 自煎饮片：RM 199 起。
7-Day Plan 代煎药液：RM 249 起。
28-Day Month 基础饮片包月：RM 799。
28-Day Month 代煎药液疗程：RM 999，药液分批代煎，每 5 到 7 天配送一次。
28-Day Month 尊享饮片包月：RM 1299 起。

配送与物流：
饮片药材可通过普通快递寄送。
西马普通快递一般 RM 10 到 15。
东马及偏远地区按实际报价。
代煎药液建议使用 Lalamove 同城配送，费用不包含在套餐内，按 App 实时报价实报实销。
自取免费，可到合作药材店自取。
28 天饮片包月方案可享西马免邮。

费用说明：
所有中药方案需先完成线上问诊，不建议未问诊直接购买中药。
价格为常规处方起步价。若涉及贵重药材、明显加量或特殊剂型，会先报价，确认后才配药。
代煎药液建议同城配送。跨州患者建议选择饮片寄送。
患者确认费用后，才会安排配药、代煎和配送。

品牌可信度：
所有中医师均持有执业资质。
线上咨询遵循隐私和安全规范。
所有建议仅作健康参考，不替代面诊或现代医学诊断。
Fengling TCM 不夸大疗效，不承诺根治，不贬低西医。

回答规则：
只用自然中文。
不要使用 Markdown 符号，不要使用星号，不要使用井号，不要使用表格，不要使用代码块。
不要长篇大论。
每次回答尽量控制在 120 到 250 字。
客服语气要清楚、稳重、礼貌。
回答完可提出一个引导问题，例如：您想了解预约流程，还是想查看价格？
如果用户问的内容超出客服范围，要引导用户填写问诊表或联系 WhatsApp 客服。
`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...safeConversation
        ],
        temperature: 0.2,
        max_tokens: 700
      })
    });

    const json = await response.json();

    if (!response.ok) {
      const errorMessage =
        json && json.error && json.error.message
          ? json.error.message
          : "DeepSeek API error";

      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: errorMessage,
          status: response.status
        })
      };
    }

    const reply =
      json &&
      json.choices &&
      json.choices[0] &&
      json.choices[0].message &&
      json.choices[0].message.content
        ? json.choices[0].message.content
        : "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: reply })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err.message || "Server error"
      })
    };
  }
};