export const dynamic = 'force-static'

export default function SupportPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customer Support</h2>
        <p className="mt-1 text-sm text-muted-foreground">Get help from the Zendenta support team</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Quick contact */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h3 className="mb-4 font-semibold">Quick Contact</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border border-border p-4 transition hover:bg-muted">
              <div className="flex size-12 items-center justify-center rounded-full bg-sky-50 text-2xl">💬</div>
              <div>
                <p className="font-semibold">Live Chat</p>
                <p className="text-sm text-muted-foreground">Available Mon–Fri, 8am–6pm WIB</p>
              </div>
              <button className="ml-auto rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
                Start chat
              </button>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-border p-4 transition hover:bg-muted">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-2xl">📞</div>
              <div>
                <p className="font-semibold">Call Support</p>
                <p className="text-sm text-muted-foreground">+62 21-1234-5678</p>
              </div>
              <button className="ml-auto rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-muted">
                Call
              </button>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-border p-4 transition hover:bg-muted">
              <div className="flex size-12 items-center justify-center rounded-full bg-purple-50 text-2xl">✉️</div>
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-sm text-muted-foreground">support@zendenta.com</p>
              </div>
              <button className="ml-auto rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-muted">
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Submit ticket */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h3 className="mb-4 font-semibold">Submit a Ticket</h3>
          <form className="space-y-4">
            <label className="block text-sm font-medium">
              Subject
              <input className="mt-2 w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-primary" placeholder="Brief description of your issue" />
            </label>
            <label className="block text-sm font-medium">
              Category
              <select className="mt-2 w-full rounded-xl border border-border p-3 text-sm">
                <option>Billing</option>
                <option>Technical Issue</option>
                <option>Feature Request</option>
                <option>Data & Export</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Description
              <textarea
                className="mt-2 min-h-[120px] w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-primary"
                placeholder="Describe your issue in detail"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
            >
              Submit Ticket
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
