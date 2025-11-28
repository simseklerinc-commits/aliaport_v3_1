// Cari Module - CariList Component Tests
import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../test-utils';
import { CariList } from '../components/CariList';
import { useCariList, useCariMutations } from '../hooks/useCari';
import type { Cari } from '../types/cari.types';

// Mock hooks
jest.mock('../hooks/useCari');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseCariList = useCariList as jest.MockedFunction<typeof useCariList>;
const mockUseCariMutations = useCariMutations as jest.MockedFunction<typeof useCariMutations>;

// Sample test data
const mockCariData: Cari[] = [
  {
    Id: 1,
    CariKod: 'CARI001',
    Unvan: 'Test Müşteri A.Ş.',
    CariTip: 'MUSTERI',
    Rol: 'NORMAL',
    VergiDairesi: 'İstanbul Vergi Dairesi',
    VergiNo: '1234567890',
    Telefon: '+90 212 123 4567',
    Eposta: 'info@testmusteri.com',
    AktifMi: true,
  },
  {
    Id: 2,
    CariKod: 'CARI002',
    Unvan: 'Örnek Tedarikçi Ltd.',
    CariTip: 'TEDARIKCI',
    Rol: 'VIP',
    VergiDairesi: 'Ankara Vergi Dairesi',
    VergiNo: '0987654321',
    Telefon: '+90 312 987 6543',
    Eposta: 'contact@ornektedarikci.com',
    AktifMi: true,
  },
  {
    Id: 3,
    CariKod: 'CARI003',
    Unvan: 'Deniz Lojistik A.Ş.',
    CariTip: 'HER_IKISI',
    Rol: 'KURUMSAL',
    VergiDairesi: 'İzmir Vergi Dairesi',
    VergiNo: '5555555555',
    Telefon: '+90 232 555 5555',
    Eposta: 'info@denizlojistik.com',
    AktifMi: false,
  },
];

describe('CariList', () => {
  const mockDeleteCari = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseCariList.mockReturnValue({
      cariList: mockCariData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    mockUseCariMutations.mockReturnValue({
      deleteCari: mockDeleteCari,
      createCari: jest.fn(),
      updateCari: jest.fn(),
    } as any);
  });

  describe('Component Rendering', () => {
    it('should render cari list with data', () => {
      render(<CariList />);

      // Check for header
      expect(screen.getByText(/cari listesi/i)).toBeInTheDocument();

      // Check for table headers
      expect(screen.getByText(/cari kod/i)).toBeInTheDocument();
      expect(screen.getByText(/ünvan/i)).toBeInTheDocument();
      expect(screen.getByText(/tip/i)).toBeInTheDocument();

      // Check for data rows
      expect(screen.getByText('CARI001')).toBeInTheDocument();
      expect(screen.getByText('Test Müşteri A.Ş.')).toBeInTheDocument();
      expect(screen.getByText('CARI002')).toBeInTheDocument();
      expect(screen.getByText('Örnek Tedarikçi Ltd.')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      mockUseCariList.mockReturnValue({
        cariList: [],
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<CariList />);

      expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument();
    });

    it('should render error state', () => {
      const errorMessage = 'Failed to fetch cari list';
      mockUseCariList.mockReturnValue({
        cariList: [],
        isLoading: false,
        error: new Error(errorMessage),
        refetch: mockRefetch,
      } as any);

      render(<CariList />);

      expect(screen.getByText(/hata/i)).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      mockUseCariList.mockReturnValue({
        cariList: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<CariList />);

      expect(screen.getByText(/cari bulunamadı/i)).toBeInTheDocument();
    });

    it('should render create button', () => {
      render(<CariList />);

      const createButton = screen.getByRole('button', { name: /yeni cari/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(<CariList />);

      const searchInput = screen.getByPlaceholderText(/ara/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter cari list by CariKod', async () => {
      const user = userEvent.setup();
      render(<CariList />);

      const searchInput = screen.getByPlaceholderText(/ara/i);
      await user.type(searchInput, 'CARI001');

      await waitFor(() => {
        expect(screen.getByText('CARI001')).toBeInTheDocument();
        expect(screen.queryByText('CARI002')).not.toBeInTheDocument();
      });
    });

    it('should filter cari list by Unvan', async () => {
      const user = userEvent.setup();
      render(<CariList />);

      const searchInput = screen.getByPlaceholderText(/ara/i);
      await user.type(searchInput, 'Tedarikçi');

      await waitFor(() => {
        expect(screen.getByText('Örnek Tedarikçi Ltd.')).toBeInTheDocument();
        expect(screen.queryByText('Test Müşteri A.Ş.')).not.toBeInTheDocument();
      });
    });

    it('should filter cari list by phone number', async () => {
      const user = userEvent.setup();
      render(<CariList />);

      const searchInput = screen.getByPlaceholderText(/ara/i);
      await user.type(searchInput, '212');

      await waitFor(() => {
        expect(screen.getByText('Test Müşteri A.Ş.')).toBeInTheDocument();
        expect(screen.queryByText('Örnek Tedarikçi Ltd.')).not.toBeInTheDocument();
      });
    });

    it('should be case insensitive', async () => {
      const user = userEvent.setup();
      render(<CariList />);

      const searchInput = screen.getByPlaceholderText(/ara/i);
      await user.type(searchInput, 'test müşteri');

      await waitFor(() => {
        expect(screen.getByText('Test Müşteri A.Ş.')).toBeInTheDocument();
      });
    });

    it('should show all results when search is cleared', async () => {
      const user = userEvent.setup();
      render(<CariList />);

      const searchInput = screen.getByPlaceholderText(/ara/i);
      
      // Type search term
      await user.type(searchInput, 'CARI001');
      await waitFor(() => {
        expect(screen.queryByText('CARI002')).not.toBeInTheDocument();
      });

      // Clear search
      await user.clear(searchInput);
      await waitFor(() => {
        expect(screen.getByText('CARI001')).toBeInTheDocument();
        expect(screen.getByText('CARI002')).toBeInTheDocument();
        expect(screen.getByText('CARI003')).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const mockOnEdit = jest.fn();
      const user = userEvent.setup();

      render(<CariList onEdit={mockOnEdit} />);

      const editButtons = screen.getAllByRole('button', { name: /düzenle/i });
      await user.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledWith(mockCariData[0]);
    });

    it('should call onView when view button is clicked', async () => {
      const mockOnView = jest.fn();
      const user = userEvent.setup();

      render(<CariList onView={mockOnView} />);

      const viewButtons = screen.getAllByRole('button', { name: /görüntüle/i });
      await user.click(viewButtons[0]);

      expect(mockOnView).toHaveBeenCalledWith(mockCariData[0]);
    });

    it('should call onCreate when create button is clicked', async () => {
      const mockOnCreate = jest.fn();
      const user = userEvent.setup();

      render(<CariList onCreate={mockOnCreate} />);

      const createButton = screen.getByRole('button', { name: /yeni cari/i });
      await user.click(createButton);

      expect(mockOnCreate).toHaveBeenCalled();
    });

    it('should show delete confirmation before deleting', async () => {
      const user = userEvent.setup();
      render(<CariList />);

      const deleteButtons = screen.getAllByRole('button', { name: /sil/i });
      await user.click(deleteButtons[0]);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/emin misiniz/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display first page of results', () => {
      render(<CariList />);

      // All 3 items should be visible (itemsPerPage = 20 by default)
      expect(screen.getByText('CARI001')).toBeInTheDocument();
      expect(screen.getByText('CARI002')).toBeInTheDocument();
      expect(screen.getByText('CARI003')).toBeInTheDocument();
    });

    it('should show pagination info', () => {
      render(<CariList />);

      // Should show total count
      expect(screen.getByText(/toplam 3/i)).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should render active status badge', () => {
      render(<CariList />);

      const activeBadges = screen.getAllByText(/aktif/i);
      expect(activeBadges.length).toBeGreaterThan(0);
    });

    it('should render CariTip badges correctly', () => {
      render(<CariList />);

      expect(screen.getByText('MUSTERI')).toBeInTheDocument();
      expect(screen.getByText('TEDARIKCI')).toBeInTheDocument();
      expect(screen.getByText('HER_IKISI')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible table structure', () => {
      render(<CariList />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
    });

    it('should have accessible buttons with proper labels', () => {
      render(<CariList />);

      expect(screen.getByRole('button', { name: /yeni cari/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /düzenle/i }).length).toBeGreaterThan(0);
    });
  });
});
