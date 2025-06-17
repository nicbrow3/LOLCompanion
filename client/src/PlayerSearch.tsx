import { useState } from 'react';
import {
  TextInput,
  ActionIcon,
  useMantineTheme,
  Menu,
  UnstyledButton,
  Group,
  Text,
  Image,
} from '@mantine/core';
import { IconSearch, IconChevronDown } from '@tabler/icons-react';
import classes from './PlayerSearch.module.css';

interface PlayerSearchProps {
  gameName: string;
  tagLine: string;
  onGameNameChange: (value: string) => void;
  onTagLineChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  tagLineOptions: { value: string; label: string; image: string }[];
}

function RegionPicker({
  tagLine,
  onTagLineChange,
  tagLineOptions,
}: {
  tagLine: string;
  onTagLineChange: (value: string) => void;
  tagLineOptions: { value: string; label: string; image: string }[];
}) {
  const [opened, setOpened] = useState(false);
  const selected = tagLineOptions.find((item) => item.value === tagLine) || tagLineOptions[0];

  const items = tagLineOptions.map((item) => (
    <Menu.Item
      leftSection={<Image src={item.image} w={20} h={15} fit="cover" />}
      onClick={() => onTagLineChange(item.value)}
      key={item.value}
    >
      {item.value}
    </Menu.Item>
  ));

  return (
    <Menu
      onOpen={() => setOpened(true)}
      onClose={() => setOpened(false)}
      radius="md"
      width="target"
      withinPortal
    >
      <Menu.Target>
        <UnstyledButton className={classes.control} data-expanded={opened || undefined}>
          <Group gap="xs">
            <Image src={selected.image} w={24} h={18} fit="cover" />
            <span className={classes.label}>{selected.value}</span>
          </Group>
          <IconChevronDown size={16} className={classes.icon} stroke={1.5} />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>{items}</Menu.Dropdown>
    </Menu>
  );
}

export function PlayerSearch({
  gameName,
  tagLine,
  onGameNameChange,
  onTagLineChange,
  onSearch,
  loading,
  tagLineOptions,
}: PlayerSearchProps) {
  const theme = useMantineTheme();

  return (
    <Group wrap="nowrap" gap="sm">
      <TextInput
        placeholder="Game Name"
        value={gameName}
        onChange={(event) => onGameNameChange(event.currentTarget.value)}
        style={{ flex: 1 }}
        radius="xl"
        size="lg"
        rightSection={
          <ActionIcon
            size={40}
            radius="xl"
            color={theme.primaryColor}
            variant="filled"
            onClick={onSearch}
            disabled={loading || !gameName || !tagLine}
            loading={loading}
          >
            <IconSearch size="1.6rem" stroke={1.5} />
          </ActionIcon>
        }
        rightSectionWidth={46}
        onKeyDown={(event) => {
            if (event.key === 'Enter') {
                onSearch();
            }
        }}
      />
      <Text>#</Text>
      <RegionPicker tagLine={tagLine} onTagLineChange={onTagLineChange} tagLineOptions={tagLineOptions} />
    </Group>
  );
} 