export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API: User Signup
      if (path === "/api/signup" && request.method === "POST") {
        const body = await request.json();
        const id = "usr_" + Date.now();
        await env.DB.prepare(
          `INSERT INTO users (id, username, password, role, status, first_name, last_name, email) VALUES (?, ?, ?, 'attachee', 'pending', ?, ?, ?)`
        ).bind(id, body.username, body.password, body.first_name, body.last_name, body.email).run();
        return new Response(JSON.stringify({ success: true, message: "Account created. Awaiting admin approval." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // API: User Login
      if (path === "/api/login" && request.method === "POST") {
        const body = await request.json();
        const user = await env.DB.prepare(`SELECT * FROM users WHERE username = ? AND password = ?`).bind(body.username, body.password).first();
        if (!user) {
          return new Response(JSON.stringify({ success: false, error: "Invalid credentials" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (user.role === 'attachee' && user.status !== 'approved') {
          return new Response(JSON.stringify({ success: false, error: `Account is currently ${user.status}. Contact administrator.` }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ success: true, user }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // API: Get Competencies & Progress
      if (path.startsWith("/api/data/") && request.method === "GET") {
        const userId = path.split("/")[3];
        const competencies = await env.DB.prepare(`SELECT * FROM competencies`).all();
        const progress = await env.DB.prepare(`SELECT * FROM attachee_progress WHERE user_id = ?`).bind(userId).all();
        const hotNotes = await env.DB.prepare(`SELECT * FROM hot_notes WHERE user_id = ? ORDER BY logged_date DESC`).bind(userId).all();
        const messages = await env.DB.prepare(`SELECT * FROM admin_messages WHERE user_id = ? ORDER BY created_at ASC`).bind(userId).all();
        
        return new Response(JSON.stringify({
          competencies: competencies.results,
          progress: progress.results,
          hotNotes: hotNotes.results,
          messages: messages.results
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // API: Save Progress / Hot Note
      if (path === "/api/progress" && request.method === "POST") {
        const body = await request.json();
        const exists = await env.DB.prepare(`SELECT id FROM attachee_progress WHERE user_id = ? AND competency_id = ?`).bind(body.user_id, body.competency_id).first();
        if (exists) {
          await env.DB.prepare(`UPDATE attachee_progress SET rating = ?, mastered = ? WHERE user_id = ? AND competency_id = ?`).bind(body.rating, body.mastered, body.user_id, body.competency_id).run();
        } else {
          const id = "prog_" + Date.now();
          await env.DB.prepare(`INSERT INTO attachee_progress (id, user_id, competency_id, rating, mastered) VALUES (?, ?, ?, ?, ?)`).bind(id, body.user_id, body.competency_id, body.rating, body.mastered).run();
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (path === "/api/hotnote" && request.method === "POST") {
        const body = await request.json();
        const id = "note_" + Date.now();
        await env.DB.prepare(`INSERT INTO hot_notes (id, user_id, note_content) VALUES (?, ?, ?)`).bind(id, body.user_id, body.note_content).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // API: Admin Dashboard Data
      if (path === "/api/admin" && request.method === "GET") {
        const users = await env.DB.prepare(`SELECT * FROM users`).all();
        const messages = await env.DB.prepare(`SELECT m.*, u.username FROM admin_messages m JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC`).all();
        return new Response(JSON.stringify({ users: users.results, messages: messages.results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // API: Admin Actions (Approve, Reject, Reply, Delete)
      if (path === "/api/admin/action" && request.method === "POST") {
        const body = await request.json();
        if (body.action === "approve") {
          await env.DB.prepare(`UPDATE users SET status = 'approved' WHERE id = ?`).bind(body.user_id).run();
        } else if (body.action === "reject") {
          await env.DB.prepare(`UPDATE users SET status = 'rejected' WHERE id = ?`).bind(body.user_id).run();
        } else if (body.action === "delete") {
          await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(body.user_id).run();
        } else if (body.action === "reply") {
          const id = "msg_" + Date.now();
          await env.DB.prepare(`INSERT INTO admin_messages (id, user_id, sender_type, message_text) VALUES (?, ?, 'admin', ?)`).bind(id, body.user_id, body.message_text).run();
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }
};