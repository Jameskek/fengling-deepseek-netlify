exports.handler = async function(event){
  if(event.httpMethod !== "POST"){
    return { statusCode:405, body:JSON.stringify({error:"Method Not Allowed"}) };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if(!apiKey) return { statusCode:500, body:JSON.stringify({error:"Missing DEEPSEEK_API_KEY"}) };

  let data;
  try{ data = JSON.parse(event.body); }catch(e){ return {statusCode:400, body:JSON.stringify({error:"Invalid JSON"})}; }

  const systemPrompt = `
你是风铃中医在线客服，由郭铭证运营管理。
职责：
- 只回答线上看诊流程、客服联系方式、公司介绍和可信度说明。
- 不涉及任何病情分析、诊断、筛查或处方。
- 使用自然中文，礼貌、简洁、清楚。
- 回答长度控制在200-300字，每次可提出1个引导性问题，例如“您希望预约哪类服务？”
`;

  try{
    const response = await fetch("https://api.deepseek.com/chat/completions",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model:"deepseek-v4-flash",
        messages:[
          { role:"system", content: systemPrompt },
          ...data.conversation.filter(m => m.role !== "system")
        ],
        temperature:0.3,
        max_tokens:700
      })
    });

    const json = await response.json();
    const reply = json.choices?.[0]?.message?.content || "没有返回内容";
    return { statusCode:200, body:JSON.stringify({reply}) };
  }catch(err){
    return { statusCode:500, body:JSON.stringify({error:err.message}) };
  }
};