import { describe, expect, it } from "vitest";
import {
  buildDoneReturnUrl,
  completeDeeplinkHandoff,
  parseDeeplinkSearch,
  parseSafeReturnUrl,
} from "./deeplink";

describe("parseDeeplinkSearch", () => {
  it("prefills known params and ignores bad enums", () => {
    const clean =
      "?coach=1&outcome=Schedule%20consult&channel=verbal&direction=incoming&tone=anxious&stage=new_lead&obstacles=price&urgency=this_week&scriptId=btg-1&planStepId=step-9&returnUrl=" +
      encodeURIComponent("https://synapse.example/plan?x=1");
    const p = parseDeeplinkSearch(clean);
    expect(p.coachMode).toBe(true);
    expect(p.outcome).toBe("Schedule consult");
    expect(p.channel).toBe("verbal");
    expect(p.direction).toBe("incoming");
    expect(p.tone).toBe("anxious");
    expect(p.stage).toBe("new_lead");
    expect(p.obstacles).toBe("price");
    expect(p.urgency).toBe("this_week");
    expect(p.scriptId).toBe("btg-1");
    expect(p.planStepId).toBe("step-9");
    expect(p.returnUrl?.origin).toBe("https://synapse.example");
    expect(parseDeeplinkSearch("?channel=fax").channel).toBeUndefined();
  });

  it("accepts coachMode alias", () => {
    expect(parseDeeplinkSearch("?coachMode=true").coachMode).toBe(true);
  });
});

describe("parseSafeReturnUrl", () => {
  it("allows https only", () => {
    expect(parseSafeReturnUrl("https://ok.example/path")).not.toBeNull();
    expect(parseSafeReturnUrl("http://insecure.example")).toBeNull();
    expect(parseSafeReturnUrl("javascript:alert(1)")).toBeNull();
    expect(parseSafeReturnUrl("/relative")).toBeNull();
  });
});

describe("buildDoneReturnUrl", () => {
  it("appends commCoach and planStepId", () => {
    const base = new URL("https://synapse.example/plan?x=1");
    const href = buildDoneReturnUrl(base, "step-9");
    const u = new URL(href);
    expect(u.searchParams.get("x")).toBe("1");
    expect(u.searchParams.get("commCoach")).toBe("done");
    expect(u.searchParams.get("planStepId")).toBe("step-9");
  });
});

describe("completeDeeplinkHandoff", () => {
  it("posts to opener with return origin", () => {
    const messages: unknown[] = [];
    const opener = {
      postMessage(data: unknown, origin: string) {
        messages.push({ data, origin });
      },
    } as unknown as Window;
    const result = completeDeeplinkHandoff(
      new URL("https://synapse.example/plan"),
      "step-9",
      opener
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.href).toContain("commCoach=done");
    }
    expect(messages).toEqual([
      {
        data: { type: "comm-coach-complete", planStepId: "step-9" },
        origin: "https://synapse.example",
      },
    ]);
  });
});
