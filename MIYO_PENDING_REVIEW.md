# MIYO pending review — publication blockers

This file is an internal project checklist, not a public privacy policy.

## Requires school/project-owner confirmation
- Confirm the exact project purpose and which school/team is responsible for submitted participant data.
- Confirm the deployed Google Apps Script endpoint, spreadsheet/Drive configuration, authorized accounts, sharing controls, storage/retention settings, and any onward access. Do not use real student records to test locally.
- Set and communicate a retention period, deletion process, and verified privacy contact, including how a participant can withdraw photo consent or request deletion.
- Confirm participant age requirements and whether/when parent or guardian consent is required.
- Confirm the scope of photo use/editing and whether any AI tool, external editing service, or other third party processes photos. No such AI processing is asserted in the current draft.
- Confirm contact details suitable for public display. None were present in the reviewed project files, so no address or phone number has been invented.
- Review the public-facing privacy draft with both schools and applicable school/privacy stakeholders before publishing it as a final policy.

## Actions intentionally not taken
- No remote Git push, deployment, publication, external service call, credential use, or access to student submissions.
- The questionnaire UI was refined locally; its Apps Script URL, payload contract, backend source, and data files were preserved. Synthetic browser requests were intercepted locally; no real records were accessed or submitted.
- External design-reference searches failed; no specific reference sites are claimed as reviewed.

## Development verification still pending
- Optionally repeat the mocked submit flow with a stable browser harness; the states were observed in an earlier intercepted run, but a later repeat harness stopped prematurely.
- Human keyboard and screen-reader review of the full wizard remains outstanding.
