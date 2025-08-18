// Simple notification stubs (extend to email/SMS/push later)

export async function notifyUsers(users, { subject, message, type = 'app' }) {
  try {
    // Currently: log to console. Extend to email/SMS when configured.
    users = Array.isArray(users) ? users : [users];
    users.forEach((u) => {
      const id = typeof u === 'object' ? u._id || u.id : u;
      const email = typeof u === 'object' ? u.email : undefined;
      console.log(`🔔 Notification [${type}] to ${id}${email ? ` <${email}>` : ''}: ${subject} - ${message}`);
    });
    return true;
  } catch (e) {
    console.error('❌ Notification error:', e.message);
    return false;
  }
}

export default { notifyUsers };

