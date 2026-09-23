"use client";

import { useEffect, useState } from "react";

import type { Schemas } from "@/lib/backend";
import { readJson } from "@/lib/read-json";

export function useMembershipRole() {
  const [role, setRole] = useState<Schemas["PickerEntry"]["role"]>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void Promise.all([
      readJson<{ memberships: Schemas["PickerEntry"][] }>("/api/auth/session"),
      readJson<Schemas["OrganizationView"]>("/api/catalog/organization"),
    ])
      .then(([session, organization]) => {
        setRole(
          session.memberships.find(
            (row) => row.organizationId === organization.id && row.status === "ACTIVE",
          )?.role,
        );
      })
      .finally(() => setReady(true));
  }, []);

  return { role, ready, owner: role === "OWNER", managesStock: role === "OWNER" || role === "STOCK_MANAGER" };
}
