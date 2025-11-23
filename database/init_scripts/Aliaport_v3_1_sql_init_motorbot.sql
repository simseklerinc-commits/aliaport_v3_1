USE [Aliaport_v3_1];

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
