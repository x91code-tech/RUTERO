import { demoUsers } from "@/lib/demo-data";

export async function getCurrentUser() {
  return demoUsers.find((user) => user.role === "ADMIN") ?? demoUsers[0];
}
