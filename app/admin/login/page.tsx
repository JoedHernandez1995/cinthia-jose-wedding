import { login } from "./actions";
import styles from "./page.module.css";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <main className={styles.wrap}>
      <form action={login} className={styles.form}>
        <h1 className={styles.heading}>Panel de administración</h1>
        <input type="hidden" name="next" value={searchParams.next ?? "/admin"} />

        {searchParams.error && <p className={styles.error}>{searchParams.error}</p>}

        <label className={styles.label}>
          Correo
          <input type="email" name="email" required autoComplete="email" className={styles.input} />
        </label>

        <label className={styles.label}>
          Contraseña
          <input type="password" name="password" required autoComplete="current-password" className={styles.input} />
        </label>

        <button type="submit" className={styles.button}>
          Iniciar sesión
        </button>
      </form>
    </main>
  );
}
