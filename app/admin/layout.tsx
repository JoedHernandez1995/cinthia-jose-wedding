import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";
import styles from "./layout.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects unauthenticated requests before this ever
  // renders; /admin/login itself is excluded there and has no chrome (it
  // renders its own <main>, not this layout's children).
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/admin" className={styles.brand}>
            Cinthia &amp; José · Admin
          </Link>
          <Link href="/admin/guests" className={styles.navLink}>
            Invitados
          </Link>
        </nav>
        <form action={signOut}>
          <button type="submit" className={styles.signOut}>
            Cerrar sesión
          </button>
        </form>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
