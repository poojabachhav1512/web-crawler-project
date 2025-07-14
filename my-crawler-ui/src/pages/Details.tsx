import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  List,
  Badge,
  Stack,
  SimpleGrid,
  Center,
  Container,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Toaster } from '../components/ui/toaster';

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

interface BrokenLink {
  url: string;
  statusCode: number;
}
const baseUrl = import.meta.env.VITE_API_BASE_URL;

const fetchURLDetails = async (id: string): Promise<URLAnalysisResult> => {
  const { data } = await axios.get(`${baseUrl}urls/${id}`);
  return data.data;
};

function Details() {
  const { id } = useParams<{ id: string }>();

  const { data: urlDetails, isLoading, isError, error } = useQuery<URLAnalysisResult>({
    queryKey: ['urlDetails', id],
    queryFn: () => fetchURLDetails(id!),
    enabled: !!id,
  });

  if (isLoading)
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading details...</Text>
      </Box>
    );

  if (isError)
    return (
      <Box p={6}>
        <Alert.Root status="error">
          <Alert.Description />
          Error: {error?.message}
        </Alert.Root>
      </Box>
    );

  if (!urlDetails)
    return (
      <Box p={6}>
        <Alert.Root status="info">
          <Alert.Description />
          No data found.
        </Alert.Root>
      </Box>
    );

  const linkData = [
    { name: 'Internal Links', value: urlDetails.InternalLinks },
    { name: 'External Links', value: urlDetails.ExternalLinks },
  ];

  const COLORS = ['#3182CE', '#38A169'];

  let brokenLinks: BrokenLink[] = [];
  try {
    if (urlDetails.InaccessibleLinkDetails) {
      brokenLinks = JSON.parse(urlDetails.InaccessibleLinkDetails);
    }
  } catch (e) {
    console.error('Failed to parse broken links JSON:', e);
  }

  return (
    <Center>
      <Container maxW="8xl">
      <Box p={{ base: 4, md: 8 }}  mx="auto">
      <Heading size="lg" mb={6} textAlign={{ base: 'center', md: 'left' }}>
        Details for: <Text as="span" color="blue.500">{urlDetails.URL}</Text>
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} mb={20}>
        <Stack>
          <Text>
            <strong>Status:</strong>{' '}
            <Badge colorPalette={
              urlDetails.Status === 'done'
                ? 'green'
                : urlDetails.Status === 'running'
                ? 'blue'
                : urlDetails.Status === 'error'
                ? 'red'
                : 'gray'
            }>
              {urlDetails?.Status
                        ? urlDetails.Status.charAt(0).toUpperCase() + urlDetails.Status.slice(1)
                        : 'Unknown'}
            </Badge>
          </Text>

          {urlDetails.ErrorMessage && (
            <Text color="red.500">
              <strong>Error:</strong> {urlDetails.ErrorMessage}
            </Text>
          )}

          <Text><strong>Title:</strong> {urlDetails.PageTitle || 'N/A'}</Text>
          <Text><strong>HTML Version:</strong> {urlDetails.HTMLVersion || 'N/A'}</Text>
          <Text><strong>Has Login Form:</strong> {urlDetails.HasLoginForm ? 'Yes' : 'No'}</Text>
          <Text><strong>Last Updated:</strong> {new Date(urlDetails.UpdatedAt).toLocaleString()}</Text>
        </Stack>

        <Stack ml={'auto'}>
          <Heading size="sm" mb={2}>Heading Counts:</Heading>
          <List.Root>
            <List.Item>H1: {urlDetails.H1Count}</List.Item>
            <List.Item>H2: {urlDetails.H2Count}</List.Item>
            <List.Item>H3: {urlDetails.H3Count}</List.Item>
            <List.Item>H4: {urlDetails.H4Count}</List.Item>
            <List.Item>H5: {urlDetails.H5Count}</List.Item>
            <List.Item>H6: {urlDetails.H6Count}</List.Item>
          </List.Root>
        </Stack>
      </SimpleGrid>


      <Heading size="md" mb={4}>Link Distribution</Heading>
      <Box width="100%" height={{ base: "250px", md: "300px" }} mb={10}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={linkData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {linkData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <Heading size="md" mb={4}>Inaccessible Links ({urlDetails.InaccessibleLinks})</Heading>
      {brokenLinks.length > 0 ? (
        <List.Root>
          {brokenLinks.map((link, index) => (
            <List.Item key={index} wordBreak="break-all">
              <Badge colorScheme="red" mr={2}>{link.statusCode}</Badge>
              {link.url}
            </List.Item>
          ))}
        </List.Root>
      ) : (
        <Text>No inaccessible links found.</Text>
      )}
      </Box>
    </Container>
    </Center>
  );
}

export default Details;
