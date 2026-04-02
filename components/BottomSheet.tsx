<button
  onClick={async () => {
    console.log("✅ AI BUTTON CLICKED");

    const response = await fetch("/api/ai-supervisor-core", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "בצע עדכון להזמנה הזו",
        sender_name: "ראמי"
      })
    });

    const data = await response.json();
    console.log("✅ AI REPLY:", data.reply);
  }}
  className="
    bg-blue-600 hover:bg-blue-700 
    text-white font-bold 
    w-full py-3 rounded-full 
    shadow-xl text-lg
  "
>
  עדכן באמצעות AI
</button>
