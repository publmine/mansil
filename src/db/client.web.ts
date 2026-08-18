export async function getDatabase(): Promise<any | null> {
  // Web uses AsyncStorage fallback repositories, so SQLite database is not loaded
  return null;
}
