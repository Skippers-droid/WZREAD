import { MuiButton, MuiIconButton, MuiToggleButton } from './btn';
import { MuiSlider } from './slider';
import {
  MuiDialog,
  MuiDialogTitle,
  MuiDialogContent,
  MuiDialogContentText,
  MuiDialogActions,
} from './dialog';
import { MuiCheckbox, MuiFormControlLabel } from './checkbox';
import { MuiChip } from './chip';
import { MuiFormOverrides } from './accordion';
import { MuiGlassOverrides } from './muifields';
import { MuiMenuItem, MuiList, MuiPopover, MuiListSubheader } from './muipopover';

export const components = {
  MuiButton,
  MuiIconButton,
  MuiToggleButton,
  MuiSlider,
  MuiDialog,
  MuiDialogTitle,
  MuiDialogContent,
  MuiDialogContentText,
  MuiDialogActions,
  MuiCheckbox,
  MuiFormControlLabel,
  MuiChip,
  MuiMenuItem,
  MuiList,
  MuiPopover,
  MuiListSubheader,
  ...MuiFormOverrides,
  ...MuiGlassOverrides,
};