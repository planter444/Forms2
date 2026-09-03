const accessKey = "kerea-admin-access";

export const grantAdminAccess = (email) => {
  sessionStorage.setItem(
    accessKey,
    JSON.stringify({
      email,
      grantedAt: Date.now()
    })
  );
};

export const getAdminAccess = () => {
  try {
    const raw = sessionStorage.getItem(accessKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAdminAccess = () => {
  sessionStorage.removeItem(accessKey);
};

export const hasAdminAccess = () => Boolean(getAdminAccess()?.email);
