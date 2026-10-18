import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { playSaleChime } from "@/lib/audio-chimes";

export type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [swRegistered, setSwRegistered] = useState(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Carrega estado e preferências
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PushPermissionState);

    const savedSound = localStorage.getItem("infropay_push_sound_enabled");
    if (savedSound !== null) {
      setSoundEnabled(savedSound === "true");
    }

    // Obtém o registro do Service Worker
    navigator.serviceWorker.ready
      .then((reg) => {
        swRegistrationRef.current = reg;
        setSwRegistered(true);
      })
      .catch(() => {
        // Fallback: tentar obter registros existentes
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            swRegistrationRef.current = reg;
            setSwRegistered(true);
          }
        });
      });
  }, []);

  const toggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem("infropay_push_sound_enabled", String(enabled));
  };

  /**
   * Pede permissão ao utilizador para enviar notificações push no sistema operacional
   */
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Notificações não são suportadas neste navegador.");
      return false;
    }

    setIsSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PushPermissionState);

      if (result === "granted") {
        toast.success("Notificações de vendas ativadas com sucesso!", {
          description:
            "Receberás alertas a cada nova venda, mesmo com o navegador em segundo plano.",
        });

        // Garante que o Service Worker está registado
        let reg = swRegistrationRef.current;
        if (!reg && "serviceWorker" in navigator) {
          reg = await navigator.serviceWorker.register("/sw.js");
          swRegistrationRef.current = reg;
        }

        // Toca o som de confirmação
        playSaleChime();

        // Envia notificação de boas-vindas
        if (reg) {
          reg.showNotification("🔔 Notificações InfroPay Ativas!", {
            body: "Agora és alertado instantaneamente sempre que realizares uma venda.",
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            ...({ vibrate: [100, 50, 100] } as NotificationOptions),
            tag: "welcome-notification",
          });
        }
        return true;
      } else if (result === "denied") {
        toast.error("Permissão de notificações recusada no navegador.", {
          description: "Para ativar, clica no ícone de cadeado na barra de endereço do navegador.",
        });
        return false;
      }
      return false;
    } catch (err) {
      console.error("Erro ao solicitar permissão de notificações:", err);
      toast.error("Não foi possível ativar as notificações.");
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  /**
   * Agenda um teste de notificação após X segundos para o utilizador poder
   * minimizar o ecrã ou fechar a aba e comprovar o funcionamento
   */
  const scheduleTestNotification = useCallback(
    (delaySeconds = 5) => {
      if (permission !== "granted") {
        requestPermission().then((granted) => {
          if (granted) {
            scheduleTestNotification(delaySeconds);
          }
        });
        return;
      }

      toast.info(`Teste agendado para daqui a ${delaySeconds} segundos!`, {
        description: "Podes minimizar ou mudar de aba agora para ver a notificação a chegar.",
      });

      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SCHEDULE_TEST_NOTIFICATION",
          delayMs: delaySeconds * 1000,
          title: "🎉 Nova Venda Aprovada! (+35.000 Kz)",
          body: "Cliente: Pedro Manuel · Produto: Pack Design Gráfico 2026",
        });
      } else if (swRegistrationRef.current) {
        setTimeout(() => {
          if (soundEnabled) playSaleChime();
          swRegistrationRef.current?.showNotification("🎉 Nova Venda Aprovada! (+35.000 Kz)", {
            body: "Cliente: Pedro Manuel · Produto: Pack Design Gráfico 2026",
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            vibrate: [200, 100, 200, 100, 200],
            tag: "infropay-test-" + Date.now(),
          });
        }, delaySeconds * 1000);
      } else {
        setTimeout(() => {
          if (soundEnabled) playSaleChime();
          new Notification("🎉 Nova Venda Aprovada! (+35.000 Kz)", {
            body: "Cliente: Pedro Manuel · Produto: Pack Design Gráfico 2026",
            icon: "/pwa-192x192.png",
          });
        }, delaySeconds * 1000);
      }
    },
    [permission, requestPermission, soundEnabled],
  );

  // Escuta novas vendas do produtor em tempo real via Supabase Realtime
  useEffect(() => {
    let channel: any = null;

    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;

      channel = supabase
        .channel(`producer-sales-push:${uid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "sales",
            filter: `producer_id=eq.${uid}`,
          },
          (payload) => {
            const sale = payload.new as any;
            if (sale.status === "pago") {
              handleNewPaidSale(sale);
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sales",
            filter: `producer_id=eq.${uid}`,
          },
          (payload) => {
            const sale = payload.new as any;
            const oldSale = payload.old as any;
            if (sale.status === "pago" && oldSale?.status !== "pago") {
              handleNewPaidSale(sale);
            }
          },
        )
        .subscribe();
    });

    function handleNewPaidSale(sale: any) {
      const valKz = ((sale.gross_cents ?? 0) / 100).toLocaleString("pt-AO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      const customer = sale.buyer_name || "Cliente";

      // 1. Toca som de venda ("Ka-ching!") se ativado
      if (soundEnabled) {
        playSaleChime();
      }

      // 2. Toast in-app
      toast.success(`🎉 Venda Confirmada: +${valKz} Kz!`, {
        description: `Comprador: ${customer}`,
        duration: 8000,
      });

      // 3. Notificação Push em segundo plano via Service Worker
      if (Notification.permission === "granted") {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_SALE_NOTIFICATION",
            title: `💰 Nova Venda Aprovada! (+${valKz} Kz)`,
            body: `Comprador: ${customer} · Pagamento recebido com sucesso.`,
            url: "/produtor",
          });
        } else if (swRegistrationRef.current) {
          swRegistrationRef.current.showNotification(`💰 Nova Venda Aprovada! (+${valKz} Kz)`, {
            body: `Comprador: ${customer} · Pagamento recebido com sucesso.`,
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            vibrate: [200, 100, 200, 100, 200],
            tag: `sale-${sale.id}`,
            data: { url: "/produtor" },
          });
        }
      }
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  return {
    permission,
    isSubscribing,
    soundEnabled,
    swRegistered,
    toggleSound,
    requestPermission,
    scheduleTestNotification,
  };
}
