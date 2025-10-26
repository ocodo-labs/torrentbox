export const fetchTop100Magnet = async (
  href: string
): Promise<string | null> => {
  try {
    const response = await fetch("/api/torrents/top-100-magnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ href }),
    });
    const data = await response.json();
    return data.magnet || null;
  } catch (err) {
    return null;
  }
};
