export const sqlTextQueryLinkedSocialFomPolygonLogs = `SELECT
  *
FROM
  POLYGON.LOGS
WHERE
  contract_address = '0xe8e183B6eaC345B53457b38C1826A4fA2FE6fC4A'
  AND name = 'SocialLinked'
  AND data_ LIKE '%"platform": "twitter"%'
LIMIT
  20;`;

// LinkedWallet
export const sqlTextQueryLinkedWalletFomPolygonLogs = `SELECT
  *
FROM
  POLYGON.LOGS
WHERE
  contract_address = '0x8Be54781c820c29c41F47f023792a94239FAaf1B'
LIMIT
  20;`;

//Discord Attendance
export const sqlTextQueryDiscordAttendancePolygonLogs = `SELECT
  *
FROM
  POLYGON.LOGS
WHERE
  contract_address = '0xdf84939656ef74A87dC60C290Ff9517487f1eECc'
LIMIT
  20;`;

export const sqlTextQueryLinkedSocial = `SELECT
 w.CONTRACT_NAME
,p.NAME
,CAST(p.TIME_STAMP AS date) AS TXN_Date
,p.CONTRACT_ADDRESS
,from_json( p.DATA_ , 'STRUCT<wildfileId:INTEGER, platform:STRING>') AS event_json
,event_json.wildfileId
,event_json.platform
FROM  POLYGON.LOGS AS p
JOIN  WILDCARD.WILDEVENT_CONTRACTS AS w
  ON  p.CONTRACT_ADDRESS = w.CONTRACT_ADDRESS
WHERE TIME_STAMP BETWEEN '2023-08-10' AND '2023-08-11'
 AND  W.CONTRACT_NAME = 'Linked Social Wildevent'`;

export const sqlTextQueryLinkedSocialMaterialisedView = `SELECT * FROM WILDCARD.Wildevent_mvw_Event_LinkedSocial
UNION 
SELECT 
 p.NAME
,p.TIME_STAMP AS Time_Stamp
,p.CONTRACT_ADDRESS
,from_json( p.DATA_ , 'STRUCT<wildfileId:INTEGER, platform:STRING>') AS event_json
,event_json.wildfileId 
,event_json.platform
FROM  POLYGON.LOGS AS p 
WHERE lower(p.CONTRACT_ADDRESS) = lower('0xe8e183B6eaC345B53457b38C1826A4fA2FE6fC4A')
  AND TIME_STAMP BETWEEN current_date AND current_date+1`;

export const sqlTextQueryDiscordAttendanceMaterialisedView = `SELECT *
    FROM WILDCARD.Wildevent_mvw_Event_DiscordEventAttendance`;
