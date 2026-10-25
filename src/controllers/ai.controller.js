import OpenAI from "openai";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Payroll from "../models/Payroll.js";
import Department from "../models/Department.js";
import Company from "../models/Company.js";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Simple tools the AI can call
const tools = [
  {
    type: "function",
    function: {
      name: "get_employee_count",
      description: "Get total number of active employees",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_today_attendance_summary",
      description: "Get today's attendance summary (present, late, absent, on-leave)",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_leaves",
      description: "Get count of pending leave requests",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_leave_balance",
      description: "Get leave balance of the current logged-in user",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_department_list",
      description: "Get list of all departments",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

async function executeTool(name, args, user) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (name) {
    case "get_employee_count":
      return {
        count: await User.countDocuments({ role: "employee", isActive: true }),
      };
    case "get_today_attendance_summary":
      return {
        present: await Attendance.countDocuments({
          date: today,
          status: { $in: ["present", "late"] },
        }),
        late: await Attendance.countDocuments({ date: today, isLate: true }),
        absent: await Attendance.countDocuments({ date: today, status: "absent" }),
        onLeave: await Attendance.countDocuments({ date: today, status: "on-leave" }),
      };
    case "get_pending_leaves":
      return { pending: await Leave.countDocuments({ status: "pending" }) };
    case "get_my_leave_balance":
      return { balances: user.leaveBalances || {} };
    case "get_department_list": {
      const depts = await Department.find().select("name");
      return { departments: depts.map((d) => d.name) };
    }
    default:
      return { error: "Unknown tool" };
  }
}

export const chatWithAI = async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GROQ_API_KEY not configured in .env",
      });
    }

    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message required" });
    }

    // Privacy guardrails
    const systemPrompt = `You are HCM Lite AI Assistant - a helpful HR assistant for an internal company system.
Rules:
- Only answer questions related to HR, attendance, leaves, payroll, employees and company policies.
- Never reveal other employees' personal salary, password, or private data unless the user is Admin/HR and the question is legitimate aggregate stats.
- For employees: only talk about THEIR own data (leave balance, own attendance).
- Be concise, friendly and professional.
- If asked something outside HR scope, politely decline.
- Current user role: ${req.user.role}, name: ${req.user.name}.
- Use tools when you need real-time numbers from the database.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6), // last few messages
      { role: "user", content: message },
    ];

    let response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 800,
    });

    let assistantMessage = response.choices[0].message;

    // Handle tool calls (simple one-round)
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const fnName = toolCall.function.name;
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch (_) {}

        const result = await executeTool(fnName, args, req.user);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Second call with tool results
      response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.3,
        max_tokens: 800,
      });
      assistantMessage = response.choices[0].message;
    }

    res.json({
      success: true,
      reply: assistantMessage.content || "Sorry, I could not generate a response.",
    });
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "AI service error",
    });
  }
};
