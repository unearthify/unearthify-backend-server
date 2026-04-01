const generateEmailTemplate = ({ type, role = "user", data }) => {
  const isApproved = type.includes("APPROVED");
  const isRejected = type.includes("REJECTED");
  const isAdmin = role === "admin";

  const TITLES = {
    NEW_ARTIST_SIGNUP: "New Artist Signup Request",
    ARTIST_SIGNUP_APPROVED: "Signup Approved",
    ARTIST_SIGNUP_REJECTED: "Signup Rejected",
    NEW_ARTIST_SUBMISSION: "New Artist Submission",
    ARTIST_SUBMISSION_APPROVED: "Artist Approved",
    ARTIST_SUBMISSION_REJECTED: "Artist Rejected",
    NEW_EVENT_SUBMISSION: "New Event Submission",
    EVENT_APPROVED: "Event Approved",
    EVENT_REJECTED: "Event Rejected",
    ARTIST_SUBMISSION_REMINDER: "Pending Review Reminder",
    EVENT_SUBMISSION_REMINDER: "Pending Review Reminder"
  };

  const theme = isApproved
    ? { color: "#16a34a" }
    : isRejected
      ? { color: "#dc2626" }
      : { color: "#2563eb" };

  const getMessage = () => {
    if (type === "ARTIST_SUBMISSION_REMINDER") return "An artist submission is still awaiting your review. The artist has sent a reminder.";
    if (type === "EVENT_SUBMISSION_REMINDER") return "An event submission is still awaiting your review. The artist has sent a reminder.";
    if (isAdmin) return "A new request has been submitted. Please review it in the admin dashboard.";
    if (isApproved) return "Your submission has been approved.";
    if (isRejected) return "Your submission was not approved.";
    return "You have a new update.";
  };

  // Fields to always exclude from the details card
  const EXCLUDE_FIELDS = new Set(["name", "reason", "image", "imageId", "password"]);

  // Human-readable label formatter
  const formatLabel = (key) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .trim();

  // Build detail rows dynamically from all data fields
  const detailRows = Object.entries(data)
    .filter(([key, value]) => !EXCLUDE_FIELDS.has(key) && value !== null && value !== undefined && value !== "")
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding:10px;background:#f9fafb;border:1px solid #eee;white-space:nowrap;font-weight:600;color:#555;font-size:13px;">
            ${formatLabel(key)}
          </td>
          <td style="padding:10px;border:1px solid #eee;color:#333;font-size:13px;">
            ${value}
          </td>
        </tr>`
    )
    .join("");

  return `
<html>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:${theme.color};padding:24px;text-align:center;">
              <h2 style="margin:0;color:#ffffff;font-size:22px;">
                ${TITLES[type] || "Notification"}
              </h2>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:24px 30px;">

              <p style="margin:0 0 10px 0;font-size:14px;color:#333;">
                Hi <strong>${isAdmin ? "Admin" : (data.name || "User")}</strong>,
              </p>

              <p style="margin:0 0 20px 0;font-size:14px;color:#555;">
                ${getMessage()}
              </p>

              <!-- DYNAMIC DETAILS CARD -->
              ${detailRows
      ? `<table width="100%" cellpadding="0" cellspacing="0"
                      style="border-collapse:collapse;border-radius:8px;overflow:hidden;">
                      ${detailRows}
                    </table>`
      : ""
    }

              <!-- REASON BLOCK (rejection only) -->
              ${data.reason
      ? `<div style="margin-top:16px;padding:12px;background:#fff5f5;border-left:4px solid #dc2626;color:#b91c1c;font-size:13px;">
                      <strong>Reason:</strong> ${data.reason}
                    </div>`
      : ""
    }

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="text-align:center;padding:16px;font-size:12px;color:#999;">
              © ${new Date().getFullYear()} Unearthify
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

module.exports = generateEmailTemplate;