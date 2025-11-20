param(
    [string]$SqlInstance = "(local)",
    [string]$DbName      = "Aliaport_v3_1"
)

Write-Host ">>> [$SqlInstance] üzerinde [$DbName] için Motorbot + Sefer tabloları kontrol ediliyor..." -ForegroundColor Cyan

# --- MOTORBOT TABLOSU -------------------------------------------------
$sqlCreateMotorbot = @"
USE [$DbName];

IF OBJECT_ID(N'dbo.Motorbot', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Motorbot';

    CREATE TABLE dbo.Motorbot (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        Kod             NVARCHAR(50)  NOT NULL UNIQUE,        -- MB-001
        Ad              NVARCHAR(200) NOT NULL,               -- M/B Atlas
        Plaka           NVARCHAR(20)  NULL,                   -- 35 ABC 123
        KapasiteTon     DECIMAL(10,2) NULL,                   -- kapasite_ton
        MaxHizKnot      DECIMAL(6,2)  NULL,                   -- max_speed_knots
        OwnerCariId     INT           NULL,                   -- dbo.Cari.Id
        OwnerCariKod    NVARCHAR(50)  NULL,                   -- hızlı join için
        Durum           NVARCHAR(20)  NOT NULL 
                          CONSTRAINT DF_Motorbot_Durum DEFAULT('AKTIF'),
        AlisTarihi      DATE          NULL,
        Notlar          NVARCHAR(MAX) NULL,
        CreatedAt       DATETIME2     NOT NULL 
                          CONSTRAINT DF_Motorbot_CreatedAt DEFAULT(SYSDATETIME()),
        CreatedBy       INT           NULL,
        UpdatedAt       DATETIME2     NULL,
        UpdatedBy       INT           NULL
    );

    ALTER TABLE dbo.Motorbot
        ADD CONSTRAINT FK_Motorbot_Cari
            FOREIGN KEY (OwnerCariId) REFERENCES dbo.Cari(Id);
END
ELSE
BEGIN
    PRINT 'Table dbo.Motorbot already exists';
END
"@

# --- SEFER TABLOSU (MbTrip) -------------------------------------------
$sqlCreateMbTrip = @"
USE [$DbName];

IF OBJECT_ID(N'dbo.MbTrip', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.MbTrip';

    CREATE TABLE dbo.MbTrip (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        MotorbotId      INT           NOT NULL,               -- dbo.Motorbot.Id
        SeferTarihi     DATE          NOT NULL,               -- planlanan tarih
        CikisZamani     DATETIME2     NULL,                   -- gerçek çıkış
        DonusZamani     DATETIME2     NULL,                   -- gerçek dönüş
        KalkisIskele    NVARCHAR(100) NULL,
        VarisIskele     NVARCHAR(100) NULL,

        CariId          INT           NULL,                   -- opsiyonel müşteri
        CariKod         NVARCHAR(50)  NULL,

        YukAciklama     NVARCHAR(200) NULL,
        Notlar          NVARCHAR(MAX) NULL,

        Durum           NVARCHAR(20)  NOT NULL 
                          CONSTRAINT DF_MbTrip_Durum DEFAULT('PLANLANDI'),
        FaturaDurumu    NVARCHAR(20)  NULL,                   -- BEKLIYOR / KESILDI

        CreatedAt       DATETIME2     NOT NULL 
                          CONSTRAINT DF_MbTrip_CreatedAt DEFAULT(SYSDATETIME()),
        CreatedBy       INT           NULL,
        UpdatedAt       DATETIME2     NULL,
        UpdatedBy       INT           NULL
    );

    ALTER TABLE dbo.MbTrip
        ADD CONSTRAINT FK_MbTrip_Motorbot
            FOREIGN KEY (MotorbotId) REFERENCES dbo.Motorbot(Id);

    ALTER TABLE dbo.MbTrip
        ADD CONSTRAINT FK_MbTrip_Cari
            FOREIGN KEY (CariId) REFERENCES dbo.Cari(Id);

    CREATE INDEX IX_MbTrip_MotorbotId 
        ON dbo.MbTrip (MotorbotId, SeferTarihi);

END
ELSE
BEGIN
    PRINT 'Table dbo.MbTrip already exists';
END
"@

# --- SCRIPT DOSYALARINI YAZ VE ÇALIŞTIR -------------------------------
$sqlFileMotorbot = Join-Path $PSScriptRoot "Aliaport_v3_1_sql_init_motorbot.sql"
$sqlFileMbTrip   = Join-Path $PSScriptRoot "Aliaport_v3_1_sql_init_mbtrip.sql"

$sqlCreateMotorbot | Set-Content -Path $sqlFileMotorbot -Encoding UTF8
$sqlCreateMbTrip   | Set-Content -Path $sqlFileMbTrip   -Encoding UTF8

Write-Host ">>> Motorbot SQL script: $sqlFileMotorbot" -ForegroundColor Yellow
sqlcmd -S $SqlInstance -E -i $sqlFileMotorbot

Write-Host ">>> MbTrip (Sefer) SQL script: $sqlFileMbTrip" -ForegroundColor Yellow
sqlcmd -S $SqlInstance -E -i $sqlFileMbTrip

Write-Host ">>> Motorbot + Sefer tablo kurulumu bitti." -ForegroundColor Green
