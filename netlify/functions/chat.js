exports.handler = async function(event){
  if(event.httpMethod !== "POST"){
    return { statusCode:405, body:JSON.stringify({error:"Method Not Allowed"}) };
  }
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if(!apiKey) return { statusCode:500, body:JSON.stringify({error:"Missing DEEPSEEK_API_KEY"}) };

  let data;
  try{ data = JSON.parse(event.body); }catch(e){ return {statusCode:400, body:JSON.stringify({error:"Invalid JSON"})}; }

  try{
    const response = await fetch("https://api.deepseek.com/chat/completions",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model:"deepseek-v4-flash",
        messages:data.conversation,
        temperature:0.3,
        max_tokens:800
      })
    });
    const json = await response.json();
    const reply = json.choices?.[0]?.message?.content || "没有返回内容";
    return { statusCode:200, body:JSON.stringify({reply}) };
  }catch(err){
    return { statusCode:500, body:JSON.stringify({error:err.message}) };
  }
};