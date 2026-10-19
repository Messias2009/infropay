import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import wristband from "@/assets/infropay-wristband.jpg";

export function FirstSaleReward() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!["/", "/auth"].includes(pathname)) return;
    try {
      if (!sessionStorage.getItem("infropay-first-sale-dismissed")) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [pathname]);
  const dismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem("infropay-first-sale-dismissed", "1");
    } catch {
      /* Storage is optional. */
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent className="max-w-[min(440px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] overflow-y-auto rounded-lg p-5">
        <img
          src={wristband}
          alt="Pulseira de borracha azul InfroPay"
          className="w-full aspect-[3/2] object-cover rounded-md"
        />
        <DialogTitle className="text-2xl leading-tight text-gold">
          Realize a primeira venda e receba sua pulseira
        </DialogTitle>
        <DialogDescription>
          A primeira venda paga marca o início das suas conquistas InfroPay.
        </DialogDescription>
                <div className="flex flex-wrap gap-2">
          <Button asChild onClick={dismiss}>
            <Link to="/produtor/novo">Começar a vender</Link>
          </Button>
          <Button variant="outline" onClick={dismiss}>
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
