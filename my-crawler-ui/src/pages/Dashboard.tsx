import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Table,
  Badge,
  HStack,
  Checkbox, 
  Flex, 
  Spinner, 
  InputGroup, InputElement, ActionBar, ButtonGroup,
  IconButton,
  Stack,
  Portal,
  Center,
  Pagination,
  Container
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toaster } from '../components/ui/toaster';
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";



interface URLAnalysisResult {
  ID: number;
  URL: string;
  Status: string;
  HTMLVersion: string;
  PageTitle: string;
  H1Count: number;
  H2Count: number;
  H3Count: number;
  H4Count: number;
  H5Count: number;
  H6Count: number;
  InternalLinks: number;
  ExternalLinks: number;
  InaccessibleLinks: number;
  InaccessibleLinkDetails: string; 
  HasLoginForm: boolean;
  ErrorMessage: string;
  CreatedAt: string;
  UpdatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const fetchURLs = async (): Promise<URLAnalysisResult[]> => {
  const { data } = await axios.get(`${API_BASE_URL}urls`);
  return data.data;
};

const addURL = async (url: string) => {
  const { data } = await axios.post(`${API_BASE_URL}urls`, { url });
  return data;
};

// --- New functions for bulk actions ---
const reRunAnalyses = async (ids: number[]) => {
  const { data } = await axios.post(`${API_BASE_URL}urls/rerun`, { ids });
  return data;
};

const deleteURLs = async (ids: number[]) => {
  const { data } = await axios.post(`${API_BASE_URL}urls/delete-batch`, { ids });
  return data;
};
// --- End New functions ---

function Dashboard() {
  const [urlInput, setUrlInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof URLAnalysisResult>('CreatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [selectedURLs, setSelectedURLs] = useState<number[]>([]); // New state for selected IDs

  //const toast = useToast();
  const queryClient = useQueryClient();

  const { data: urls, isLoading, isError, error, isFetching } = useQuery<URLAnalysisResult[]>({
    queryKey: ['urls'],
    queryFn: fetchURLs,
    refetchInterval: 5000, 
  });

  const addURLMutation = useMutation({
    mutationFn: addURL,
    onSuccess: (err: any) => {
      toaster.create({
        title: 'URL Added.',
        description: err.response?.data?.error || err.message || 'Could not add URL.',
        type: 'success',
        duration: 3000,
        closable: true,
        //position: 'top-right',
      });
      setUrlInput('');
      queryClient.invalidateQueries({ queryKey: ['urls'] });
    },
    onError: (err: any) => {
      toaster.create({
        title: 'Error adding URL.',
        description: err.response?.data?.error || err.message || 'Could not add URL.',
        type: 'error',
        duration: 5000,
        closable: true,
        //position: 'top-right',
      });
    },
  });

  const handleSubmit = () => {
    if (urlInput) {
      addURLMutation.mutate(urlInput);
    }
  };

  // --- New Mutations for Bulk Actions ---
  const reRunAnalysisMutation = useMutation({
    mutationFn: reRunAnalyses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urls'] });
      setSelectedURLs([]); // Clear selection after action
      toaster.create({
        title: 'Re-analysis started.',
        description: 'Selected URLs are being re-processed.',
        type: 'info',
        duration: 3000,
        closable: true,
      });
    },
    onError: (err: any) => {
      toaster.create({
        title: 'Error re-running analysis.',
        description: err.response?.data?.error || err.message || 'Could not re-run analysis.',
        type: 'error',
        duration: 5000,
        closable: true,
      });
    },
  });

  const deleteURLsMutation = useMutation({
    mutationFn: deleteURLs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urls'] });
      setSelectedURLs([]); // Clear selection after action
      toaster.create({
        title: 'URLs Deleted.',
        description: 'Selected URLs have been removed.',
        type: 'success',
        duration: 3000,
        closable: true,
      });
    },
    onError: (err: any) => {
      toaster.create({
        title: 'Error deleting URLs.',
        description: err.response?.data?.error || err.message || 'Could not delete URLs.',
        type: 'error',
        duration: 5000,
        closable: true,
      });
    },
  });
  // --- End New Mutations ---


  // Memoized for performance: filters and sorts the data
  const filteredAndSortedURLs = useMemo(() => {
    if (!urls) return [];
    let filtered = urls.filter(url =>
      url.URL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.PageTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.Status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      // Handle specific sorting logic for different types
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      // For numbers (and CreatedAt/UpdatedAt which are sortable as timestamps)
      return sortOrder === 'asc' ? (valA - valB) : (valB - valA);
    });

    // Reset current page if filtered results are fewer than current page's start index

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);

  }, [urls, searchTerm, sortBy, sortOrder, currentPage, itemsPerPage]);

  const isAnyActionPending = addURLMutation.isPending || reRunAnalysisMutation.isPending || deleteURLsMutation.isPending;

  const handleSort = (column: keyof URLAnalysisResult) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const pageSize = 5;
  const [page, setPage] = useState(1);
  const totalPagesNo = Math.ceil(filteredAndSortedURLs.length / pageSize);
  const paginatedItems = filteredAndSortedURLs.slice((page - 1) * pageSize, page * pageSize);

  const [selection, setSelection] = useState<number[]>([])

  const hasSelection = selection.length > 0
  const indeterminate = hasSelection && selection.length < filteredAndSortedURLs.length

  if (isLoading && !urls) return <Box p={4}><Spinner size="xl" /> Loading URLs...</Box>;
  if (isError) {
    return (
      <Box p={4}>
        <>
          Error: {error?.message}
        </>
      </Box>
    );
  }


  return (
    <Center>
      <Container maxW="10xl">
      <Box p={4} position='center' textAlign="center">
        <Heading mb={6} size="2xl">Web Crawler Dashboard</Heading>
        <VStack align="stretch" mb={4}>
          <Input
            placeholder="Enter URL to crawl (e.g., https://example.com)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            disabled={isAnyActionPending}
          />
          <Button
            onClick={() => addURLMutation.mutate(urlInput)}
            loading={addURLMutation.isPending}
            disabled={!urlInput || isAnyActionPending}
            size="sm"
            color="blue"
            variant="outline"
          >
            Add URL for Analysis
          </Button>
          <InputElement pointerEvents="none">
            {isFetching && !isLoading ? <Spinner size="sm" /> : <SearchIcon color="gray.300" />}
          </InputElement>
          <InputGroup>

            <Input
              placeholder="Search by URL, Title, or Status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isAnyActionPending}
            />
          </InputGroup>
        </VStack>

        {/* Bulk Action Buttons */}
        <Flex mb={4} justifyContent="space-between" alignItems="center" wrap="wrap">
          <Heading size="lg">Analyzed URLs</Heading>
          {selectedURLs.length > 0 && (
            <HStack mt={{ base: 4, md: 0 }}>
              <Button
                colorScheme="teal"
                size="sm"
                onClick={() => reRunAnalysisMutation.mutate(selectedURLs)}
                loading={reRunAnalysisMutation.isPending}
                disabled={isAnyActionPending}
              >
                Re-run Analysis ({selectedURLs.length})
              </Button>
              <Button
                colorScheme="red"
                size="sm"
                onClick={() => deleteURLsMutation.mutate(selectedURLs)}
                loading={deleteURLsMutation.isPending}
                disabled={isAnyActionPending}
              >
                Delete Selected ({selectedURLs.length})
              </Button>
            </HStack>
          )}
        </Flex>

        {filteredAndSortedURLs && filteredAndSortedURLs.length > 0 ? (
          <>
            <Box>
              <Stack width="full" gap="5">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>
                        {/* Select All Checkbox */}
                        <Checkbox.Root
                          size="sm"
                          top="0.5"
                          aria-label="Select all rows"
                          checked={indeterminate ? "indeterminate" : selection.length > 0}
                          onCheckedChange={(changes) => {
                            setSelection(
                              changes.checked ? filteredAndSortedURLs.map((urlData) => urlData.ID) : [],
                            )
                          }}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader onClick={() => handleSort('URL')} cursor="pointer">URL {sortBy === 'URL' && (sortOrder === 'asc' ? (sortOrder === 'asc' ? '▲' : '▼') : '')}</Table.ColumnHeader>
                      <Table.ColumnHeader onClick={() => handleSort('Status')} cursor="pointer">Status {sortBy === 'Status' && (sortOrder === 'asc' ? '▲' : '▼')}</Table.ColumnHeader>
                      <Table.ColumnHeader onClick={() => handleSort('PageTitle')} cursor="pointer">Title {sortBy === 'PageTitle' && (sortOrder === 'asc' ? '▲' : '▼')}</Table.ColumnHeader>
                      <Table.ColumnHeader onClick={() => handleSort('HTMLVersion')} cursor="pointer">HTML Version {sortBy === 'HTMLVersion' && (sortOrder === 'asc' ? '▲' : '▼')}</Table.ColumnHeader>
                      <Table.ColumnHeader onClick={() => handleSort('InternalLinks')} cursor="pointer">Internal Links {sortBy === 'InternalLinks' && (sortOrder === 'asc' ? '▲' : '▼')}</Table.ColumnHeader>
                      <Table.ColumnHeader onClick={() => handleSort('ExternalLinks')} cursor="pointer">External Links {sortBy === 'ExternalLinks' && (sortOrder === 'asc' ? '▲' : '▼')}</Table.ColumnHeader>
                      <Table.ColumnHeader onClick={() => handleSort('InaccessibleLinks')} cursor="pointer">Inaccessible Links {sortBy === 'InaccessibleLinks' && (sortOrder === 'asc' ? '▲' : '▼')}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {paginatedItems.map((urlData) => (
                      <Table.Row key={urlData.ID}>
                        <Table.Cell>
                          {/* Individual Row Checkbox */}
                          <Checkbox.Root
                            size="sm"
                            top="0.5"
                            aria-label="Select row"
                            checked={selection.includes(urlData.ID)}
                            onCheckedChange={(changes) => {
                              setSelection((prev) =>
                                changes.checked
                                  ? [...prev, urlData.ID]
                                  : selection.filter((ID) => ID !== urlData.ID),
                              )
                            }}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                        </Table.Cell>
                        <Table.Cell><Link to={`/details/${urlData.ID}`}>{urlData.URL}</Link></Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette={
                            urlData?.Status === 'done' ? 'green' :
                              urlData?.Status === 'running' ? 'blue' :
                                urlData?.Status === 'error' ? 'red' : 'gray'
                          }>
                            {urlData?.Status
                              ? urlData.Status.charAt(0).toUpperCase() + urlData.Status.slice(1)
                              : 'Unknown'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>{urlData.PageTitle || 'N/A'}</Table.Cell>
                        <Table.Cell>{urlData.HTMLVersion || 'N/A'}</Table.Cell>
                        <Table.Cell>{urlData.InternalLinks}</Table.Cell>
                        <Table.Cell>{urlData.ExternalLinks}</Table.Cell>
                        <Table.Cell>{urlData.InaccessibleLinks}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
                <Pagination.Root count={20} pageSize={2} defaultPage={1}>
                  <ButtonGroup variant="outline" size="sm" wrap="wrap">
                    {/* Prev Button */}
                    <IconButton onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
                      <LuChevronLeft />
                    </IconButton>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPagesNo }, (_, i) => i + 1).map((p) => (
                      <IconButton
                        key={p}
                        variant={p === page ? "outline" : "outline"}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </IconButton>
                    ))}

                    {/* Next Button */}
                    <IconButton
                      onClick={() => setPage((p) => Math.min(p + 1, totalPagesNo))}
                      disabled={page === totalPagesNo}
                    >
                      <LuChevronRight />
                    </IconButton>
                  </ButtonGroup>
                </Pagination.Root>
              </Stack>
              <ActionBar.Root open={hasSelection}>
                <Portal>
                  <ActionBar.Positioner>
                    <ActionBar.Content>
                      <ActionBar.SelectionTrigger>
                        {selection.length} selected
                      </ActionBar.SelectionTrigger>
                      <ActionBar.Separator />

                      <Button
                        colorScheme="red"
                        size="sm"
                        onClick={() => deleteURLsMutation.mutate(selection)}
                        loading={deleteURLsMutation.isPending}
                        disabled={isAnyActionPending}
                        variant="outline"
                      >
                        Delete Selected ({selection.length})
                      </Button>
                      <Button
                        colorScheme="teal"
                        size="sm"
                        onClick={() => reRunAnalysisMutation.mutate(selection)}
                        loading={reRunAnalysisMutation.isPending}
                        disabled={isAnyActionPending}
                        variant="outline"
                      >
                        Re-run Analysis ({selection.length})
                      </Button>
                    </ActionBar.Content>
                  </ActionBar.Positioner>
                </Portal>
              </ActionBar.Root>
            </Box>

            {/* Pagination Controls */}

          </>
        ) : (
          <Box p={4} textAlign="center" color="gray.500">
            {isLoading ? "Loading URLs..." : (searchTerm ? "No results found for your search." : "No URLs added yet. Add one above to get started!")}
          </Box>
        )}
      </Box>
      </Container>
    </Center>
  );
}

export default Dashboard;