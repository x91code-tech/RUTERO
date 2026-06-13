export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <section className="surface max-w-md rounded-2xl p-6">
        <h1 className="text-2xl font-black">Sin conexión</h1>
        <p className="mt-3 text-zinc-400">Puedes seguir trabajando. Los movimientos pendientes quedarán en cola local para sincronizarse.</p>
      </section>
    </main>
  );
}
