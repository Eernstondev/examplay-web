import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.ernstondev.examplay",
        sha256_cert_fingerprints: [
          "48:25:4A:F4:77:1A:30:5A:F3:41:16:7D:00:DD:87:F4:42:1F:D3:6E:82:F3:A2:9C:27:57:4C:B7:64:C1:A7:28",
        ],
      },
    },
  ]);
}
