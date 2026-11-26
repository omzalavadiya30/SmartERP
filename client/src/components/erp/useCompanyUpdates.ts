"use client";
import { useEffect } from "react";
import Cookies from "js-cookie";
import api from "@/lib/axios";
export function useCompanyUpdates(company: string | undefined, refresh: () => void) {
  useEffect(() => {
    if (!company) return;
    const controller = new AbortController();
    let retry: ReturnType<typeof setTimeout>;
    async function connect() {
      try {
        const response = await fetch(api.getUri({ url: "/companies/" + company + "/updates" }), {
          headers: { Authorization: "Bearer " + Cookies.get("token") },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          refresh();
          return;
        }
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let part = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunks = (part + value).split("\n\n");
          part = chunks.pop() || "";
          if (chunks.some((chunk) => chunk.startsWith("data:"))) refresh();
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      if (!controller.signal.aborted) {
        refresh();
        retry = setTimeout(connect, 1500);
      }
    }
    void connect();
    return () => {
      controller.abort();
      clearTimeout(retry);
    };
  }, [company, refresh]);
}
