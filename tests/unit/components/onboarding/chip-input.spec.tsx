import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChipInput } from "@/components/onboarding/chip-input";

function renderCtl(initial: string[] = []) {
  const onChange = vi.fn();
  render(
    <ChipInput
      name="skills"
      label="Skills"
      value={initial}
      onChange={onChange}
    />,
  );
  return { onChange };
}

describe("ChipInput", () => {
  it("adds a chip on Enter and clears input", () => {
    const { onChange } = renderCtl([]);
    const input = screen.getByLabelText("Skills");
    fireEvent.change(input, { target: { value: "Python" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["Python"]);
  });

  it("removes the last chip on Backspace when input is empty", () => {
    const { onChange } = renderCtl(["Python", "ML"]);
    const input = screen.getByLabelText("Skills");
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onChange).toHaveBeenCalledWith(["Python"]);
  });

  it("removes a chip via the delete button", () => {
    const { onChange } = renderCtl(["Python", "ML"]);
    fireEvent.click(screen.getByRole("button", { name: "Remove Python" }));
    expect(onChange).toHaveBeenCalledWith(["ML"]);
  });

  it("dedupes identical tags (case-insensitive)", () => {
    const { onChange } = renderCtl(["Python"]);
    const input = screen.getByLabelText("Skills");
    fireEvent.change(input, { target: { value: "python" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders an empty-state message when value is empty", () => {
    renderCtl([]);
    expect(screen.getByText(/no skills added yet/i)).toBeInTheDocument();
  });

  it("applies aria-invalid when invalid", () => {
    render(
      <ChipInput
        name="skills"
        label="Skills"
        value={[]}
        onChange={() => {}}
        invalid
        describedById="skills-err"
      />,
    );
    const input = screen.getByLabelText("Skills");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "skills-err");
  });
});