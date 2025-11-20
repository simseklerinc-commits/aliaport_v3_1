USE [Aliaport_v3_1];

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
