async function wait(ms = 280) {
  return new Promise((r) => setTimeout(r, ms));
}

export const api = {
  async get<T>(loader: () => T): Promise<T> {
    await wait();
    return loader();
  },
  async post<T>(loader: () => T): Promise<T> {
    await wait(360);
    return loader();
  },
};
